import { randomUUID } from 'node:crypto';
import { createServer, type Server as HTTPServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const realtime = vi.hoisted(() => ({
	notifyEventCreated: vi.fn(),
	notifyEventUpdated: vi.fn(),
	notifyEventDeleted: vi.fn(),
}));
vi.mock('@/realtime/emitters/event.emitters.js', () => realtime);

const { supabaseAdmin, supabaseAnon } = await import('@/shared/config/supabase.js');
const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { errorHandler } = await import('@/shared/middleware/error-handler.js');
const { authMiddleware } = await import('@/features/auth/auth.middleware.js');
const { createEventsRouter } = await import('@/features/events/events.routes.js');

// Against the local stack (scripts/test-db.sh); only the Socket.io emitters are mocked.

interface TestUser {
	id: string;
	token: string;
}

interface EventBody {
	id: string;
	beaconMinor: number;
	accessInfo?: string;
	playlist: { id: string } | null;
}

interface ApiBody {
	success: boolean;
	data?: { event?: EventBody; events?: EventBody[]; id?: string };
	error?: { code?: string };
}

const PASSWORD = 'integration-test-password';
const HOUR = 3_600_000;
const users: TestUser[] = [];

const iso = (offset: number) => new Date(Date.now() + offset).toISOString();

async function createUser(): Promise<TestUser> {
	const email = `int-events-${randomUUID()}@example.com`;
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: PASSWORD,
		email_confirm: true,
	});
	if (error) throw error;
	const id = data.user.id;
	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id, username: `inte_${id.slice(0, 8)}` });
	if (profileError) throw profileError;
	const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
		email,
		password: PASSWORD,
	});
	if (signInError) throw signInError;
	const user = { id, token: session.session.access_token };
	users.push(user);
	return user;
}

async function createPlaylist(ownerId: string, visibility: 'public' | 'private'): Promise<string> {
	const { data, error } = await supabaseAdmin
		.from('playlists')
		.insert({ owner_id: ownerId, name: 'int-events', visibility })
		.select('id')
		.single();
	if (error) throw error;
	return data.id;
}

function eventInput(overrides: Record<string, unknown> = {}) {
	return {
		name: 'Rooftop',
		address: '96 boulevard Bessières, Paris',
		latitude: 48.8966,
		longitude: 2.3185,
		accessInfo: 'Building C, 7th floor',
		genres: ['electronic'],
		startsAt: iso(-HOUR),
		endsAt: iso(2 * HOUR),
		...overrides,
	};
}

describe('Event routes (/api/events)', () => {
	let httpServer: HTTPServer;
	let baseUrl: string;
	let organiser: TestUser;
	let guest: TestUser;

	async function call(
		method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
		path: string,
		user: TestUser,
		body?: unknown
	): Promise<{ status: number; body: ApiBody }> {
		const res = await fetch(`${baseUrl}/api/events${path}`, {
			method,
			headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
			body: body === undefined ? undefined : JSON.stringify(body),
		});
		return { status: res.status, body: (await res.json()) as ApiBody };
	}

	async function create(user: TestUser, overrides: Record<string, unknown> = {}) {
		const res = await call('POST', '', user, eventInput(overrides));
		expect(res.status).toBe(201);
		return res.body.data!.event!;
	}

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		const app = express();
		app.use(express.json());
		app.use('/api/events', createEventsRouter(authMiddleware));
		app.use(errorHandler);
		httpServer = createServer(app);
		await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
		baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;

		organiser = await createUser();
		guest = await createUser();
	});

	beforeEach(() => vi.clearAllMocks());

	afterAll(async () => {
		try {
			for (const user of users) await supabaseAdmin.auth.admin.deleteUser(user.id); // cascades
			if (isRedisConnected()) {
				const keys = await redisClient.keys('rl:events:*');
				if (keys.length > 0) await redisClient.del(...keys);
			}
			await new Promise<void>(resolve => httpServer?.close(() => resolve()));
		} finally {
			await disconnectRedis();
		}
	});

	it('creates, updates and deletes an event, emitting each change', async () => {
		const event = await create(organiser);
		expect(event.beaconMinor).toBeGreaterThanOrEqual(1);
		expect(event.beaconMinor).toBeLessThanOrEqual(65535);
		expect(realtime.notifyEventCreated).toHaveBeenCalledWith(
			expect.objectContaining({ id: event.id })
		);

		const updated = await call('PATCH', `/${event.id}`, organiser, { accessInfo: 'Side door' });
		expect(updated.status).toBe(200);
		expect(updated.body.data?.event?.accessInfo).toBe('Side door');
		expect(realtime.notifyEventUpdated).toHaveBeenCalledOnce();

		const deleted = await call('DELETE', `/${event.id}`, organiser);
		expect(deleted.status).toBe(200);
		expect(realtime.notifyEventDeleted).toHaveBeenCalledWith({ eventId: event.id });
		expect((await call('GET', `/${event.id}`, organiser)).status).toBe(404);
	});

	it("refuses another user's update and delete with 403 EVENT_ACCESS_DENIED", async () => {
		const event = await create(organiser);

		const updated = await call('PATCH', `/${event.id}`, guest, { name: 'Mine now' });
		expect(updated.status).toBe(403);
		expect(updated.body.error?.code).toBe('EVENT_ACCESS_DENIED');

		const deleted = await call('DELETE', `/${event.id}`, guest);
		expect(deleted.status).toBe(403);
		expect(realtime.notifyEventDeleted).not.toHaveBeenCalled();
	});

	it('lists active events with their coordinates and beacon minor, never ended ones', async () => {
		const active = await create(organiser);
		const ended = await create(organiser);
		const { error } = await supabaseAdmin
			.from('events')
			.update({ starts_at: iso(-3 * HOUR), ends_at: iso(-HOUR) })
			.eq('id', ended.id);
		if (error) throw error;

		const res = await call('GET', '', guest);
		expect(res.status).toBe(200);
		const ids = res.body.data!.events!.map(event => event.id);
		expect(ids).toContain(active.id);
		expect(ids).not.toContain(ended.id);
		expect(res.body.data!.events!.find(event => event.id === active.id)).toMatchObject({
			latitude: 48.8966,
			longitude: 2.3185,
			beaconMinor: active.beaconMinor,
		});
	});

	it('gives every event its own beacon minor', async () => {
		const events = await Promise.all(Array.from({ length: 10 }, () => create(organiser)));
		const minors = new Set(events.map(event => event.beaconMinor));
		expect(minors.size).toBe(events.length);
	});

	it("refuses a private playlist or another user's playlist with 400 EVENT_PLAYLIST_INVALID", async () => {
		const privatePlaylist = await createPlaylist(organiser.id, 'private');
		const othersPlaylist = await createPlaylist(guest.id, 'public');

		for (const playlistId of [privatePlaylist, othersPlaylist]) {
			const res = await call('POST', '', organiser, eventInput({ playlistId }));
			expect(res.status).toBe(400);
			expect(res.body.error?.code).toBe('EVENT_PLAYLIST_INVALID');
		}
	});

	it('hides a linked playlist once it turns private', async () => {
		const playlistId = await createPlaylist(organiser.id, 'public');
		const event = await create(organiser, { playlistId });
		expect(event.playlist?.id).toBe(playlistId);

		await supabaseAdmin.from('playlists').update({ visibility: 'private' }).eq('id', playlistId);

		const res = await call('GET', `/${event.id}`, guest);
		expect(res.body.data?.event?.playlist).toBeNull();
	});
});
