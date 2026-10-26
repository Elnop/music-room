import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express, { type NextFunction, type Request, type Response } from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Before env.ts is parsed: limiting on, nobody whitelisted, a low SoundCloud limit.
vi.hoisted(() => {
	process.env.RATE_LIMIT_ENABLED = 'true';
	process.env.RATE_LIMIT_WHITELIST_IPS = '';
	process.env.RATE_LIMIT_SOUNDCLOUD_MAX = '8';
	process.env.RATE_LIMIT_SOUNDCLOUD_WINDOW_MS = '60000';
});

// SoundCloud is never called: the services are replaced.
const service = vi.hoisted(() => ({
	searchTracks: vi.fn(),
	getTrack: vi.fn(),
	getStreamUrl: vi.fn(),
}));
vi.mock('@/features/soundcloud/services/soundcloud-search.service.js', () => ({
	searchTracks: service.searchTracks,
	getTrack: service.getTrack,
}));
vi.mock('@/features/soundcloud/services/soundcloud-stream.service.js', () => ({
	getStreamUrl: service.getStreamUrl,
}));

const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { supabaseAdmin, supabaseAnon } = await import('@/shared/config/supabase.js');
const { default: soundcloudRoutes } = await import('@/features/soundcloud/soundcloud.routes.js');
const { soundcloudRateLimiter } = await import('@/shared/security/http-rate-limit.js');
const { rateLimitConfig } = await import('@/shared/config/rate-limit.config.js');
const { errorHandler } = await import('@/shared/middleware/error-handler.js');

const KEY_PATTERN = 'rl:soundcloud:*';
const PASSWORD = 'integration-test-password';
const MAX = 8;
const TRACK_URL = 'https://soundcloud.com/artist/track';

async function clearKeys(): Promise<void> {
	const keys = await redisClient.keys(KEY_PATTERN);
	if (keys.length > 0) await redisClient.del(...keys);
}

async function createSignedInUser(): Promise<{ id: string; token: string }> {
	const email = `int-${randomUUID()}@example.com`;
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: PASSWORD,
		email_confirm: true,
	});
	if (error) throw error;
	const id = data.user.id;
	const { error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.insert({ id, username: `int_${id.slice(0, 8)}` });
	if (profileError) throw profileError;
	const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
		email,
		password: PASSWORD,
	});
	if (signInError) throw signInError;
	return { id, token: session.session.access_token };
}

function listen(app: express.Express): Promise<{ server: Server; baseUrl: string }> {
	const server = createServer(app);
	return new Promise(resolve =>
		server.listen(0, '127.0.0.1', () => {
			const { port } = server.address() as AddressInfo;
			resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
		})
	);
}

describe('SoundCloud routes: auth, per-user rate limit, validation', () => {
	const servers: Server[] = [];
	let baseUrl: string;
	let alice: { id: string; token: string };
	let bob: { id: string; token: string };

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');
		expect(rateLimitConfig.soundcloud.max).toBe(MAX);

		alice = await createSignedInUser();
		bob = await createSignedInUser();

		const app = express();
		app.use(express.json());
		app.use('/api/soundcloud', soundcloudRoutes);
		app.use(errorHandler);
		const started = await listen(app);
		servers.push(started.server);
		baseUrl = started.baseUrl;
	});

	beforeEach(async () => {
		if (isRedisConnected()) await clearKeys();
		service.searchTracks.mockReset().mockResolvedValue({ tracks: [], count: 0 });
		service.getTrack.mockReset().mockResolvedValue({ id: 1, title: 'Track' });
		service.getStreamUrl.mockReset().mockResolvedValue({
			streamUrl: 'https://cf-hls-media.sndcdn.com/x.m3u8',
			protocol: 'hls',
			expiresAt: '2026-01-01T00:30:00.000Z',
		});
	});

	afterAll(async () => {
		try {
			if (isRedisConnected()) await clearKeys();
			await Promise.all(
				servers.map(server => new Promise<void>(resolve => server.close(() => resolve())))
			);
			for (const user of [alice, bob]) {
				if (user) await supabaseAdmin.auth.admin.deleteUser(user.id);
			}
		} finally {
			await disconnectRedis();
		}
	});

	const get = (path: string, token?: string) =>
		fetch(`${baseUrl}/api/soundcloud${path}`, {
			headers: token ? { Authorization: `Bearer ${token}` } : {},
		});

	async function errorOf(
		res: globalThis.Response
	): Promise<{ code: string; details?: { retryAfter?: string } }> {
		const body = (await res.json()) as {
			error: { code: string; details?: { retryAfter?: string } };
		};
		return body.error;
	}

	const encoded = encodeURIComponent(TRACK_URL);

	it('answers 401 without a token on every route, without calling SoundCloud', async () => {
		for (const path of [
			'/search?q=lofi',
			'/track/123',
			`/stream?url=${encoded}`,
			`/stream/${encoded}`,
		]) {
			const res = await get(path);
			expect(res.status, path).toBe(401);
		}
		expect(service.searchTracks).not.toHaveBeenCalled();
		expect(service.getTrack).not.toHaveBeenCalled();
		expect(service.getStreamUrl).not.toHaveBeenCalled();
	});

	it('serves a signed-in user with valid input as before', async () => {
		const search = await get('/search?q=lofi&limit=5', alice.token);
		expect(search.status).toBe(200);
		expect(await search.json()).toMatchObject({
			success: true,
			data: { tracks: [], count: 0 },
		});
		expect(service.searchTracks).toHaveBeenCalledWith({ q: 'lofi', limit: 5, offset: 0 });

		const byId = await get('/track/123456', alice.token);
		expect(byId.status).toBe(200);
		expect(await byId.json()).toMatchObject({ success: true, data: { id: 1 } });
		expect(service.getTrack).toHaveBeenLastCalledWith('123456');

		const byUrl = await get(`/track/${encoded}`, alice.token);
		expect(byUrl.status).toBe(200);
		expect(service.getTrack).toHaveBeenLastCalledWith(TRACK_URL);

		const stream = await get(`/stream?url=${encoded}`, alice.token);
		expect(stream.status).toBe(200);
		expect(await stream.json()).toMatchObject({
			success: true,
			data: {
				streamUrl: 'https://cf-hls-media.sndcdn.com/x.m3u8',
				protocol: 'hls',
				expiresAt: '2026-01-01T00:30:00.000Z',
			},
		});
		expect(service.getStreamUrl).toHaveBeenLastCalledWith(TRACK_URL);
	});

	it('accepts the legacy /stream/:trackUrl and the on., www. and m. SoundCloud hosts', async () => {
		const legacy = await get(`/stream/${encoded}`, alice.token);
		expect(legacy.status).toBe(200);
		expect(service.getStreamUrl).toHaveBeenLastCalledWith(TRACK_URL);

		for (const url of [
			'https://on.soundcloud.com/AbCd',
			'https://www.soundcloud.com/artist/track',
			'https://m.soundcloud.com/artist/track',
		]) {
			const res = await get(`/stream?url=${encodeURIComponent(url)}`, alice.token);
			expect(res.status, url).toBe(200);
			expect(service.getStreamUrl).toHaveBeenLastCalledWith(url);
		}
	});

	it('answers 400 VALIDATION_ERROR for a stream url that is not a SoundCloud URL', async () => {
		for (const url of [
			'https://evil.example/x',
			'not a url',
			'http://soundcloud.com/artist/track',
			'https://soundcloud.com.evil.example/x',
			'https://soundcloud.com/',
		]) {
			const query = await get(`/stream?url=${encodeURIComponent(url)}`, alice.token);
			expect(query.status, url).toBe(400);
			expect((await errorOf(query)).code).toBe('VALIDATION_ERROR');
		}
		const legacy = await get(`/stream/${encodeURIComponent('https://evil.example/x')}`, bob.token);
		expect(legacy.status).toBe(400);
		expect((await errorOf(legacy)).code).toBe('VALIDATION_ERROR');

		const repeated = await get(`/stream?url=${encoded}&url=${encoded}`, bob.token);
		expect(repeated.status).toBe(400);
		expect((await errorOf(repeated)).code).toBe('VALIDATION_ERROR');

		expect(service.getStreamUrl).not.toHaveBeenCalled();
	});

	it('keeps 400 MISSING_TRACK_URL when the stream url is absent or empty', async () => {
		for (const path of ['/stream', '/stream?url=']) {
			const res = await get(path, alice.token);
			expect(res.status, path).toBe(400);
			expect((await errorOf(res)).code).toBe('MISSING_TRACK_URL');
		}
		expect(service.getStreamUrl).not.toHaveBeenCalled();
	});

	it('answers 400 VALIDATION_ERROR for a track that is neither a SoundCloud URL nor an id', async () => {
		for (const value of ['abc', '12a', encodeURIComponent('https://evil.example/x')]) {
			const res = await get(`/track/${value}`, alice.token);
			expect(res.status, value).toBe(400);
			expect((await errorOf(res)).code).toBe('VALIDATION_ERROR');
		}
		expect(service.getTrack).not.toHaveBeenCalled();
	});

	it('answers 429 past the per-user limit, in Redis, without affecting another user', async () => {
		for (let i = 0; i < MAX; i++) {
			const res = await get('/search?q=lofi', alice.token);
			expect(res.status).toBe(200);
		}

		const keys = await redisClient.keys(KEY_PATTERN);
		expect(keys).toEqual([`rl:soundcloud:soundcloud:${alice.id}`]);
		expect(Number(await redisClient.get(keys[0]))).toBe(MAX);

		service.searchTracks.mockClear();
		const blocked = await get('/stream?url=' + encoded, alice.token);
		expect(blocked.status).toBe(429);
		const error = await errorOf(blocked);
		expect(error.code).toBe('RATE_LIMIT_EXCEEDED');
		expect(new Date(error.details?.retryAfter ?? 0).getTime()).toBeGreaterThan(Date.now());
		expect(service.getStreamUrl).not.toHaveBeenCalled();

		const other = await get('/search?q=lofi', bob.token);
		expect(other.status).toBe(200);
	});

	// Last: it closes the Redis connection.
	it('fails closed with 503 RATE_LIMIT_UNAVAILABLE while Redis is down', async () => {
		// The limiter alone, behind a stand-in for authMiddleware (which itself
		// answers 503 REVOCATION_UNAVAILABLE without Redis).
		const app = express();
		app.get(
			'/limited',
			(req: Request, _res: Response, next: NextFunction) => {
				(req as Request & { user: { id: string; email: string } }).user = {
					id: alice.id,
					email: 'alice@example.com',
				};
				next();
			},
			soundcloudRateLimiter,
			(_req, res) => {
				res.json({ ok: true });
			}
		);
		app.use(errorHandler);
		const started = await listen(app);
		servers.push(started.server);

		const before = await fetch(`${started.baseUrl}/limited`);
		expect(before.status).toBe(200);

		await clearKeys();
		const closed = new Promise(resolve => redisClient.once('close', resolve));
		redisClient.disconnect();
		await closed;
		expect(isRedisConnected()).toBe(false);

		const res = await fetch(`${started.baseUrl}/limited`);
		expect(res.status).toBe(503);
		expect((await errorOf(res)).code).toBe('RATE_LIMIT_UNAVAILABLE');

		const route = await get(`/stream?url=${encoded}`, alice.token);
		expect(route.status).toBe(503);
		expect(service.getStreamUrl).not.toHaveBeenCalled();
	});
});
