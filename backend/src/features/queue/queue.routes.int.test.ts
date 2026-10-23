import { randomUUID } from 'node:crypto';
import { createServer, type Server as HTTPServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin, supabaseAnon } from '@/shared/config/supabase.js';
import { connectRedis, disconnectRedis, isRedisConnected } from '@/shared/config/redis.js';
import { errorHandler } from '@/shared/middleware/error-handler.js';
import type { QueueState } from '@/features/queue/queue.types.js';

// Real user, token, playlist and queue rows; only the Socket.io emitter is mocked.

vi.mock('@/realtime/emitters/queue.emitters.js', () => ({ notifyQueueUpdate: vi.fn() }));

const { default: queueRoutes } = await import('@/features/queue/queue.routes.js');

const PASSWORD = 'integration-test-password';
const URI_PREFIX = `https://soundcloud.com/int-queue-routes/${randomUUID()}`;

interface ApiBody {
	success: boolean;
	data?: QueueState;
	error?: { code?: string };
}

async function createUser(): Promise<{ id: string; token: string }> {
	const email = `int-queue-${randomUUID()}@example.com`;
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: PASSWORD,
		email_confirm: true,
	});
	if (error) throw error;
	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id: data.user.id, username: `intq_${data.user.id.slice(0, 8)}` });
	if (profileError) throw profileError;
	const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
		email,
		password: PASSWORD,
	});
	if (signInError) throw signInError;
	return { id: data.user.id, token: session.session.access_token };
}

/** A public playlist of `ownerId` with `n` tracks, written as the playlists feature does; returns the track ids. */
async function createPlaylist(
	ownerId: string,
	n: number
): Promise<{ id: string; trackIds: string[] }> {
	const { data: playlist, error } = await supabaseAdmin
		.from('playlists')
		.insert({ owner_id: ownerId, name: 'int-queue-routes', visibility: 'public' })
		.select('id')
		.single();
	if (error) throw error;
	const trackIds: string[] = [];
	for (let i = 1; i <= n; i++) {
		const { data: track, error: trackError } = await supabaseAdmin
			.from('tracks')
			.insert({ track_uri: `${URI_PREFIX}/${i}`, title: `T${i}`, artist: 'A', duration_ms: 1000 })
			.select('id')
			.single();
		if (trackError) throw trackError;
		const { error: addError } = await supabaseAdmin.rpc('playlist_add_track', {
			p_playlist_id: playlist.id,
			p_track_id: track.id,
		});
		if (addError) throw addError;
		trackIds.push(track.id);
	}
	return { id: playlist.id, trackIds };
}

const current = (state: QueueState) =>
	state.items.find(item => item.id === state.currentItemId)?.track.title;

describe('Queue routes: POST /api/queue/playlists/:playlistId/play', () => {
	let httpServer: HTTPServer;
	let baseUrl: string;
	let user: { id: string; token: string };
	let playlistId: string;
	let trackIds: string[];

	async function post(path: string, body: object = {}): Promise<{ status: number; body: ApiBody }> {
		const res = await fetch(`${baseUrl}/api/queue${path}`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		return { status: res.status, body: (await res.json()) as ApiBody };
	}

	beforeAll(async () => {
		// verifyToken checks the logout denylist and fails closed without Redis.
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		const app = express();
		app.use(express.json());
		app.use('/api/queue', queueRoutes);
		app.use(errorHandler);
		httpServer = createServer(app);
		await new Promise<void>(resolve => httpServer.listen(0, resolve));
		baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;

		user = await createUser();
		({ id: playlistId, trackIds } = await createPlaylist(user.id, 4));
	});

	afterAll(async () => {
		await new Promise<void>(resolve => httpServer.close(() => resolve()));
		await disconnectRedis();
		if (user) await supabaseAdmin.auth.admin.deleteUser(user.id); // cascades
		await supabaseAdmin.from('tracks').delete().like('track_uri', `${URI_PREFIX}/%`);
	});

	it('plays from the first track without startTrackId', async () => {
		const { status, body } = await post(`/playlists/${playlistId}/play`);

		expect(status).toBe(200);
		expect(current(body.data!)).toBe('T1');
	});

	it('starts on startTrackId, with the earlier tracks as previous and the later ones next', async () => {
		const played = await post(`/playlists/${playlistId}/play`, { startTrackId: trackIds[2] });
		expect(played.status).toBe(200);
		expect(current(played.body.data!)).toBe('T3');

		const next = await post('/next');
		expect(current(next.body.data!)).toBe('T4');

		await post('/previous');
		const previous = await post('/previous');
		expect(current(previous.body.data!)).toBe('T2');
	});

	it('answers 404 PLAYLIST_TRACK_NOT_FOUND for a track outside the playlist', async () => {
		const { status, body } = await post(`/playlists/${playlistId}/play`, {
			startTrackId: randomUUID(),
		});

		expect(status).toBe(404);
		expect(body.error?.code).toBe('PLAYLIST_TRACK_NOT_FOUND');
	});
});
