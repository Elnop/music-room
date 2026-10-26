import { randomUUID } from 'node:crypto';
import { createServer, type Server as HTTPServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const realtime = vi.hoisted(() => ({
	notifyPlaylistDetails: vi.fn(),
	notifyPlaylistDeleted: vi.fn(),
	revalidatePlaylistRoom: vi.fn(() => Promise.resolve()),
}));
vi.mock('@/realtime/emitters/playlist.emitters.js', () => realtime);

const { supabaseAdmin, supabaseAnon } = await import('@/shared/config/supabase.js');
const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { errorHandler } = await import('@/shared/middleware/error-handler.js');
const { default: playlistRoutes } = await import('@/features/playlists/playlist.routes.js');
const { COVER_BUCKET } = await import('@/features/playlists/services/playlist-cover.service.js');

// Against the local stack (Storage, test Redis); only the Socket.io emitters are mocked.

interface TestUser {
	id: string;
	token: string;
}

interface ApiBody {
	success: boolean;
	data?: { coverUrl?: string | null; playlist?: { coverUrl?: string } };
	error?: { code?: string };
}

const PASSWORD = 'integration-test-password';
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(2048, 7)]);
const users: TestUser[] = [];
const playlistIds: string[] = [];

async function createUser(plan: 'free' | 'premium' = 'premium'): Promise<TestUser> {
	const email = `int-cover-${randomUUID()}@example.com`;
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: PASSWORD,
		email_confirm: true,
	});
	if (error) throw error;
	const id = data.user.id;
	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id, username: `intc_${id.slice(0, 8)}`, plan });
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

async function createPlaylist(ownerId: string): Promise<string> {
	const { data, error } = await supabaseAdmin
		.from('playlists')
		.insert({ owner_id: ownerId, name: 'int-cover', visibility: 'public' })
		.select('id')
		.single();
	if (error) throw error;
	playlistIds.push(data.id);
	return data.id;
}

async function storedFiles(playlistId: string): Promise<string[]> {
	const { data, error } = await supabaseAdmin.storage.from(COVER_BUCKET).list(playlistId);
	if (error) throw error;
	return data.map(file => `${playlistId}/${file.name}`);
}

async function setPlan(userId: string, plan: 'free' | 'premium'): Promise<void> {
	const { error } = await supabaseAdmin.from('user_profiles').update({ plan }).eq('id', userId);
	if (error) throw error;
}

function coverForm(content: Buffer): FormData {
	const form = new FormData();
	form.append('cover', new Blob([new Uint8Array(content)], { type: 'image/jpeg' }), 'cover.jpg');
	return form;
}

describe('Playlist cover routes (/api/playlists/:id/cover)', () => {
	let httpServer: HTTPServer;
	let baseUrl: string;

	async function call(
		method: 'GET' | 'PUT' | 'DELETE',
		path: string,
		user: TestUser,
		body?: FormData
	): Promise<{ status: number; body: ApiBody }> {
		const res = await fetch(`${baseUrl}/api/playlists${path}`, {
			method,
			headers: { Authorization: `Bearer ${user.token}` },
			body,
		});
		return { status: res.status, body: (await res.json()) as ApiBody };
	}

	const upload = (user: TestUser, playlistId: string, content = JPEG) =>
		call('PUT', `/${playlistId}/cover`, user, coverForm(content));

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		const app = express();
		app.use(express.json());
		app.use('/api/playlists', playlistRoutes);
		app.use(errorHandler);
		httpServer = createServer(app);
		await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
		baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
	});

	beforeEach(() => vi.clearAllMocks());

	afterAll(async () => {
		try {
			for (const playlistId of playlistIds) {
				const files = await storedFiles(playlistId);
				if (files.length) await supabaseAdmin.storage.from(COVER_BUCKET).remove(files);
			}
			for (const user of users) await supabaseAdmin.auth.admin.deleteUser(user.id); // cascades
			if (isRedisConnected()) {
				const keys = await redisClient.keys('rl:playlists:cover:*');
				if (keys.length > 0) await redisClient.del(...keys);
			}
			await new Promise<void>(resolve => httpServer?.close(() => resolve()));
		} finally {
			await disconnectRedis();
		}
	});

	it('stores a Premium owner’s cover, returns it on GET and tells the room', async () => {
		const owner = await createUser();
		const playlistId = await createPlaylist(owner.id);

		const res = await upload(owner, playlistId);

		expect(res.status).toBe(200);
		const coverUrl = res.body.data?.coverUrl as string;
		expect(coverUrl).toMatch(
			new RegExp(`/storage/v1/object/public/playlist-covers/${playlistId}/[0-9a-f-]{36}\\.jpg$`)
		);
		expect((await call('GET', `/${playlistId}`, owner)).body.data?.playlist?.coverUrl).toBe(
			coverUrl
		);
		expect(realtime.notifyPlaylistDetails).toHaveBeenCalledWith(
			expect.objectContaining({ playlistId, coverUrl, name: 'int-cover' })
		);
		expect((await fetch(coverUrl)).status).toBe(200);
	});

	it('refuses a free owner (PREMIUM_REQUIRED) and a non-owner (PLAYLIST_ACCESS_DENIED)', async () => {
		const freeOwner = await createUser('free');
		const freePlaylist = await createPlaylist(freeOwner.id);
		const free = await upload(freeOwner, freePlaylist);
		expect(free.status).toBe(403);
		expect(free.body.error?.code).toBe('PREMIUM_REQUIRED');

		const owner = await createUser();
		const stranger = await createUser();
		const playlistId = await createPlaylist(owner.id);
		const denied = await upload(stranger, playlistId);
		expect(denied.status).toBe(403);
		expect(denied.body.error?.code).toBe('PLAYLIST_ACCESS_DENIED');
		expect((await call('DELETE', `/${playlistId}/cover`, stranger)).status).toBe(403);

		expect(await storedFiles(freePlaylist)).toHaveLength(0);
		expect(await storedFiles(playlistId)).toHaveLength(0);
	});

	it('refuses a file over 2 MB (413) and a non-image (400), storing nothing', async () => {
		const owner = await createUser();
		const playlistId = await createPlaylist(owner.id);

		const big = await upload(owner, playlistId, Buffer.concat([JPEG, Buffer.alloc(3 * 1024 * 1024)]));
		expect(big.status).toBe(413);
		expect(big.body.error?.code).toBe('FILE_TOO_LARGE');

		const text = await upload(owner, playlistId, Buffer.from('I am not an image'));
		expect(text.status).toBe(400);
		expect(text.body.error?.code).toBe('INVALID_IMAGE');

		expect(await storedFiles(playlistId)).toHaveLength(0);
	});

	it('keeps the cover after a downgrade, and lets the owner remove it', async () => {
		const owner = await createUser();
		const playlistId = await createPlaylist(owner.id);
		const coverUrl = (await upload(owner, playlistId)).body.data?.coverUrl;
		await setPlan(owner.id, 'free');

		expect((await call('GET', `/${playlistId}`, owner)).body.data?.playlist?.coverUrl).toBe(
			coverUrl
		);
		expect((await upload(owner, playlistId)).body.error?.code).toBe('PREMIUM_REQUIRED');

		const removed = await call('DELETE', `/${playlistId}/cover`, owner);
		expect(removed.status).toBe(200);
		expect(removed.body.data).toEqual({ coverUrl: null });
		expect((await call('GET', `/${playlistId}`, owner)).body.data?.playlist?.coverUrl).toBeUndefined();
		expect(await storedFiles(playlistId)).toHaveLength(0);
		expect(realtime.notifyPlaylistDetails).toHaveBeenLastCalledWith(
			expect.objectContaining({ playlistId, coverUrl: undefined })
		);
	});

	it('leaves no orphan file when the cover is replaced or the playlist deleted', async () => {
		const owner = await createUser();
		const playlistId = await createPlaylist(owner.id);
		await upload(owner, playlistId);
		const second = (await upload(owner, playlistId)).body.data?.coverUrl as string;

		const files = await storedFiles(playlistId);
		expect(files).toHaveLength(1);
		expect(second.endsWith(files[0])).toBe(true);

		expect((await call('DELETE', `/${playlistId}`, owner)).status).toBe(200);
		await vi.waitFor(async () => expect(await storedFiles(playlistId)).toHaveLength(0));
	});
});
