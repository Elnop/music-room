import { randomUUID } from 'node:crypto';
import { createServer, type Server as HTTPServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { supabaseAdmin, supabaseAnon } from '@/shared/config/supabase.js';
import { connectRedis, disconnectRedis, isRedisConnected } from '@/shared/config/redis.js';
import { errorHandler } from '@/shared/middleware/error-handler.js';
import friendsRoutes from '@/features/friends/friends.routes.js';

// Real users, tokens and `follows` rows; every test starts with no follows between A, B, C.

interface TestUser {
	id: string;
	username: string;
	token: string;
}

interface ApiBody {
	success: boolean;
	data?: unknown;
	error?: { code?: string };
}

interface FollowStatus {
	isFollowing: boolean;
	isFollowedBy: boolean;
	isFriend: boolean;
	followersCount: number;
	followingCount: number;
}

interface Friend {
	id: string;
	username: string;
}

const PASSWORD = 'integration-test-password';

async function createUser(): Promise<TestUser> {
	const email = `int-friends-${randomUUID()}@example.com`;
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: PASSWORD,
		email_confirm: true,
	});
	if (error) throw error;
	const id = data.user.id;
	const username = `intf_${id.slice(0, 8)}`;

	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id, username });
	if (profileError) throw profileError;

	// Sign in with the anon client, never the admin one.
	const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
		email,
		password: PASSWORD,
	});
	if (signInError) throw signInError;
	return { id, username, token: session.session.access_token };
}

describe('Friends routes (/api/friends)', () => {
	let httpServer: HTTPServer;
	let baseUrl: string;
	let a: TestUser;
	let b: TestUser;
	let c: TestUser;

	async function call(
		method: 'GET' | 'POST' | 'DELETE',
		path: string,
		user?: TestUser
	): Promise<{ status: number; body: ApiBody }> {
		const res = await fetch(`${baseUrl}/api/friends${path}`, {
			method,
			headers: user ? { Authorization: `Bearer ${user.token}` } : {},
		});
		return { status: res.status, body: (await res.json()) as ApiBody };
	}

	async function follow(from: TestUser, to: TestUser): Promise<FollowStatus> {
		const { status, body } = await call('POST', `/follow/${to.id}`, from);
		expect(status).toBe(200);
		return (body.data as { status: FollowStatus }).status;
	}

	async function friendsOf(user: TestUser): Promise<Friend[]> {
		const { status, body } = await call('GET', '/', user);
		expect(status).toBe(200);
		return body.data as Friend[];
	}

	async function followRows(followerId: string, followingId: string): Promise<number> {
		const { count, error } = await supabaseAdmin
			.from('follows')
			.select('*', { count: 'exact', head: true })
			.eq('follower_id', followerId)
			.eq('following_id', followingId);
		if (error) throw error;
		return count ?? 0;
	}

	async function clearFollows(): Promise<void> {
		const ids = [a, b, c].filter(Boolean).map(u => u.id);
		if (!ids.length) return;
		const { error: e1 } = await supabaseAdmin.from('follows').delete().in('follower_id', ids);
		if (e1) throw e1;
		const { error: e2 } = await supabaseAdmin.from('follows').delete().in('following_id', ids);
		if (e2) throw e2;
	}

	beforeAll(async () => {
		// verifyToken checks the logout denylist and fails closed without Redis.
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		const app = express();
		app.use(express.json());
		app.use('/api/friends', friendsRoutes);
		app.use(errorHandler);
		httpServer = createServer(app);
		await new Promise<void>(resolve => httpServer.listen(0, resolve));
		baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;

		[a, b, c] = await Promise.all([createUser(), createUser(), createUser()]);
	});

	beforeEach(async () => {
		await clearFollows();
	});

	afterAll(async () => {
		await clearFollows();
		for (const user of [a, b, c].filter(Boolean))
			await supabaseAdmin.auth.admin.deleteUser(user.id);
		await new Promise<void>(resolve => httpServer?.close(() => resolve()));
		await disconnectRedis();
	});

	it('answers 401 NO_AUTH_HEADER on every route without a token', async () => {
		const routes: Array<['GET' | 'POST' | 'DELETE', string]> = [
			['GET', '/'],
			['GET', '/stats/me'],
			['GET', `/status/${b.id}`],
			['POST', `/follow/${b.id}`],
			['DELETE', `/follow/${b.id}`],
		];
		for (const [method, path] of routes) {
			const { status, body } = await call(method, path);
			expect(status, `${method} ${path}`).toBe(401);
			expect(body.error?.code).toBe('NO_AUTH_HEADER');
		}
		expect(await followRows(a.id, b.id)).toBe(0);
	});

	it('follows a user and stores the row', async () => {
		const status = await follow(a, b);

		expect(status).toMatchObject({
			isFollowing: true,
			isFollowedBy: false,
			isFriend: false,
			followersCount: 1,
		});
		expect(await followRows(a.id, b.id)).toBe(1);
	});

	it('following twice keeps a single row', async () => {
		await follow(a, b);
		const status = await follow(a, b);

		expect(status.isFollowing).toBe(true);
		expect(status.followersCount).toBe(1);
		expect(await followRows(a.id, b.id)).toBe(1);
	});

	it('makes A and B friends when they follow each other', async () => {
		await follow(a, b);
		const status = await follow(b, a);
		expect(status).toMatchObject({ isFollowing: true, isFollowedBy: true, isFriend: true });

		const fromA = await call('GET', `/status/${b.id}`, a);
		expect((fromA.body.data as FollowStatus).isFriend).toBe(true);
		const fromB = await call('GET', `/status/${a.id}`, b);
		expect((fromB.body.data as FollowStatus).isFriend).toBe(true);

		expect(await friendsOf(a)).toEqual([
			expect.objectContaining({ id: b.id, username: b.username }),
		]);
		expect(await friendsOf(b)).toEqual([
			expect.objectContaining({ id: a.id, username: a.username }),
		]);
	});

	it('a one-way follow makes nobody a friend', async () => {
		await follow(a, b);

		expect(await friendsOf(a)).toEqual([]);
		expect(await friendsOf(b)).toEqual([]);
	});

	it('refuses a self-follow with 400 SELF_FOLLOW_ERROR and stores nothing', async () => {
		const { status, body } = await call('POST', `/follow/${a.id}`, a);

		expect(status).toBe(400);
		expect(body.error?.code).toBe('SELF_FOLLOW_ERROR');
		expect(await followRows(a.id, a.id)).toBe(0);
	});

	it('answers 404 USER_NOT_FOUND for an unknown target', async () => {
		const unknownId = randomUUID();
		const { status, body } = await call('POST', `/follow/${unknownId}`, a);

		expect(status).toBe(404);
		expect(body.error?.code).toBe('USER_NOT_FOUND');
		expect(await followRows(a.id, unknownId)).toBe(0);
	});

	it('answers a malformed id as the database lookup always did', async () => {
		const routes: Array<['GET' | 'POST' | 'DELETE', string, number, string]> = [
			['GET', '/status/not-a-uuid', 500, 'FOLLOW_STATUS_ERROR'],
			['POST', '/follow/not-a-uuid', 404, 'USER_NOT_FOUND'],
			['DELETE', '/follow/not-a-uuid', 500, 'UNFOLLOW_ERROR'],
		];
		for (const [method, path, expected, code] of routes) {
			const { status, body } = await call(method, path, a);
			expect(status, `${method} ${path}`).toBe(expected);
			expect(body.error?.code, `${method} ${path}`).toBe(code);
		}
	});

	it('accepts every input form of the Postgres uuid type, as the lookup always did', async () => {
		await follow(a, b);

		for (const id of [b.id.replaceAll('-', ''), `{${b.id}}`]) {
			const { status, body } = await call('GET', `/status/${id}`, a);
			expect(status, id).toBe(200);
			expect(body.data, id).toMatchObject({ isFollowing: true, followersCount: 1 });
		}
	});

	it('unfollowing ends the friendship on both sides', async () => {
		await follow(a, b);
		await follow(b, a);

		const { status, body } = await call('DELETE', `/follow/${b.id}`, a);
		expect(status).toBe(200);
		expect((body.data as { status: FollowStatus }).status).toMatchObject({
			isFollowing: false,
			isFollowedBy: true,
			isFriend: false,
		});
		expect(await followRows(a.id, b.id)).toBe(0);
		expect(await friendsOf(a)).toEqual([]);
		expect(await friendsOf(b)).toEqual([]);
	});

	it('unfollowing someone not followed is a no-op', async () => {
		await follow(b, a);

		const { status, body } = await call('DELETE', `/follow/${c.id}`, a);
		expect(status).toBe(200);
		expect((body.data as { status: FollowStatus }).status).toMatchObject({
			isFollowing: false,
			isFriend: false,
		});
		expect(await followRows(b.id, a.id)).toBe(1);
	});

	it("status reports the target's own follower and following counts", async () => {
		// B: followed by A and C, follows C.
		await follow(a, b);
		await follow(c, b);
		await follow(b, c);

		const { status, body } = await call('GET', `/status/${b.id}`, a);
		expect(status).toBe(200);
		expect(body.data).toEqual({
			isFollowing: true,
			isFollowedBy: false,
			isFriend: false,
			followersCount: 2,
			followingCount: 1,
		});
	});

	it("stats/me reports the caller's own counts", async () => {
		// A: follows B and C, followed by C.
		await follow(a, b);
		await follow(a, c);
		await follow(c, a);

		const { status, body } = await call('GET', '/stats/me', a);
		expect(status).toBe(200);
		expect(body.data).toEqual({ followersCount: 1, followingCount: 2 });
	});
});
