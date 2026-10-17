import { randomUUID } from 'node:crypto';
import { createServer, type Server as HTTPServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Before env.ts is parsed: limiting on, nobody whitelisted, 3 avatar changes per window.
vi.hoisted(() => {
	process.env.RATE_LIMIT_ENABLED = 'true';
	process.env.RATE_LIMIT_WHITELIST_IPS = '';
	process.env.RATE_LIMIT_AVATAR_MAX = '3';
});

const { supabaseAdmin, supabaseAnon } = await import('@/shared/config/supabase.js');
const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { errorHandler } = await import('@/shared/middleware/error-handler.js');
const { default: profileRoutes } = await import('@/features/profile/profile.routes.js');
const { AVATAR_BUCKET } = await import('@/features/profile/services/avatar.service.js');

// PUT and DELETE /api/profile/avatar (#351) over HTTP against the local stack:
// real users and tokens, the `avatars` bucket of migration 027 in Storage, the
// avatar limiter counting in the test Redis. Each test uses fresh users, so the
// 3-per-window limit only bites in the rate-limit test.

interface TestUser {
	id: string;
	token: string;
}

interface ApiBody {
	success: boolean;
	data?: { avatarUrl?: string | null } & Record<string, unknown>;
	error?: { code?: string };
}

const PASSWORD = 'integration-test-password';
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(2048, 7)]);
const GOOGLE_PICTURE = 'https://lh3.googleusercontent.com/a/int-test=s96-c';

const users: TestUser[] = [];

async function createUser(): Promise<TestUser> {
	const email = `int-avatar-${randomUUID()}@example.com`;
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: PASSWORD,
		email_confirm: true,
	});
	if (error) throw error;
	const id = data.user.id;

	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id, username: `inta_${id.slice(0, 8)}` });
	if (profileError) throw profileError;

	// Sign in with the anon client, never the admin one (#136).
	const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
		email,
		password: PASSWORD,
	});
	if (signInError) throw signInError;
	const user = { id, token: session.session.access_token };
	users.push(user);
	return user;
}

function photoForm(content: Buffer, type = 'image/jpeg'): FormData {
	const form = new FormData();
	form.append('avatar', new Blob([new Uint8Array(content)], { type }), 'avatar.jpg');
	return form;
}

async function storedFiles(userId: string): Promise<string[]> {
	const { data, error } = await supabaseAdmin.storage.from(AVATAR_BUCKET).list(userId);
	if (error) throw error;
	return data.map(file => `${userId}/${file.name}`);
}

async function avatarUrlOf(userId: string): Promise<string | null> {
	const { data, error } = await supabaseAdmin
		.from('user_profiles')
		.select('avatar_url')
		.eq('id', userId)
		.single();
	if (error) throw error;
	return data.avatar_url;
}

describe('Avatar routes (/api/profile/avatar)', () => {
	let httpServer: HTTPServer;
	let baseUrl: string;

	async function call(
		method: 'GET' | 'PUT' | 'DELETE',
		path: string,
		user: TestUser,
		body?: FormData
	): Promise<{ status: number; body: ApiBody }> {
		const res = await fetch(`${baseUrl}/api/profile${path}`, {
			method,
			headers: { Authorization: `Bearer ${user.token}` },
			body,
		});
		return { status: res.status, body: (await res.json()) as ApiBody };
	}

	const upload = (user: TestUser, content = JPEG, type = 'image/jpeg') =>
		call('PUT', '/avatar', user, photoForm(content, type));

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		const app = express();
		app.use(express.json());
		app.use('/api/profile', profileRoutes);
		app.use(errorHandler);
		httpServer = createServer(app);
		await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
		baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
	});

	afterAll(async () => {
		try {
			for (const user of users) {
				const files = await storedFiles(user.id);
				if (files.length) await supabaseAdmin.storage.from(AVATAR_BUCKET).remove(files);
				await supabaseAdmin.auth.admin.deleteUser(user.id);
			}
			if (isRedisConnected()) {
				const keys = await redisClient.keys('rl:profile:avatar:*');
				if (keys.length > 0) await redisClient.del(...keys);
			}
			await new Promise<void>(resolve => httpServer?.close(() => resolve()));
		} finally {
			await disconnectRedis();
		}
	});

	it('stores the photo in the public bucket and saves its URL', async () => {
		const me = await createUser();

		const res = await upload(me);

		expect(res.status).toBe(200);
		const avatarUrl = res.body.data?.avatarUrl as string;
		expect(avatarUrl).toMatch(
			new RegExp(`/storage/v1/object/public/avatars/${me.id}/[0-9a-f-]{36}\\.jpg$`)
		);
		expect(await avatarUrlOf(me.id)).toBe(avatarUrl);
		expect(await storedFiles(me.id)).toHaveLength(1);

		const publicFile = await fetch(avatarUrl);
		expect(publicFile.status).toBe(200);
		expect(publicFile.headers.get('content-type')).toBe('image/jpeg');
		expect(Buffer.compare(Buffer.from(await publicFile.arrayBuffer()), JPEG)).toBe(0);
	});

	it('deletes the previous photo when a new one replaces it', async () => {
		const me = await createUser();
		const first = (await upload(me)).body.data?.avatarUrl as string;

		const second = await upload(me);

		expect(second.status).toBe(200);
		const secondUrl = second.body.data?.avatarUrl as string;
		expect(secondUrl).not.toBe(first);
		const files = await storedFiles(me.id);
		expect(files).toHaveLength(1);
		expect(secondUrl.endsWith(files[0])).toBe(true);
	});

	it('replaces an external (Google) picture without trying to delete it', async () => {
		const me = await createUser();
		await supabaseAdmin
			.from('user_profiles')
			.update({ avatar_url: GOOGLE_PICTURE })
			.eq('id', me.id);

		const res = await upload(me);

		expect(res.status).toBe(200);
		expect(await avatarUrlOf(me.id)).toBe(res.body.data?.avatarUrl);
		expect(await storedFiles(me.id)).toHaveLength(1);
	});

	it('removes the photo: avatar_url null and the file deleted', async () => {
		const me = await createUser();
		const avatarUrl = (await upload(me)).body.data?.avatarUrl as string;

		const res = await call('DELETE', '/avatar', me);

		expect(res.status).toBe(200);
		expect(res.body.data).toEqual({ avatarUrl: null });
		expect(await avatarUrlOf(me.id)).toBeNull();
		expect(await storedFiles(me.id)).toHaveLength(0);
		expect((await fetch(avatarUrl)).ok).toBe(false);
	});

	it('refuses a text file named .jpg (INVALID_IMAGE) and a 3 MB file (413), storing nothing', async () => {
		const me = await createUser();

		const text = await upload(me, Buffer.from('I am not a photo'), 'image/jpeg');
		expect(text.status).toBe(400);
		expect(text.body.error?.code).toBe('INVALID_IMAGE');

		const big = await upload(me, Buffer.concat([JPEG, Buffer.alloc(3 * 1024 * 1024)]));
		expect(big.status).toBe(413);
		expect(big.body.error?.code).toBe('FILE_TOO_LARGE');

		expect(await storedFiles(me.id)).toHaveLength(0);
		expect(await avatarUrlOf(me.id)).toBeNull();
	});

	it('answers 429 past the per-user limit, without touching the profile', async () => {
		const me = await createUser();
		for (let i = 0; i < 3; i++) {
			expect((await call('DELETE', '/avatar', me)).status).toBe(200);
		}

		const res = await upload(me);

		expect(res.status).toBe(429);
		expect(res.body.error?.code).toBe('RATE_LIMIT_EXCEEDED');
		expect(await storedFiles(me.id)).toHaveLength(0);

		// Another user keeps their own budget.
		const other = await createUser();
		expect((await upload(other)).status).toBe(200);
	});

	it('still hides a friends_only avatar from a non-friend', async () => {
		const me = await createUser();
		const stranger = await createUser();
		const avatarUrl = (await upload(me)).body.data?.avatarUrl as string;
		const { error } = await supabaseAdmin
			.from('profile_privacy')
			.update({ avatar_visibility: 'friends_only' })
			.eq('user_id', me.id);
		if (error) throw error;

		const seenByStranger = await call('GET', `/${me.id}`, stranger);
		expect(seenByStranger.status).toBe(200);
		expect(seenByStranger.body.data).not.toHaveProperty('avatarUrl');

		const seenByMe = await call('GET', `/${me.id}`, me);
		expect(seenByMe.body.data?.avatarUrl).toBe(avatarUrl);
	});
});
