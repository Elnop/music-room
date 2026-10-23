import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express, { type Request } from 'express';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Before env.ts is parsed: limiting on, nobody whitelisted, a low token limit,
// no trusted proxy (whatever backend/.env says).
vi.hoisted(() => {
	process.env.TRUST_PROXY = '';
	process.env.RATE_LIMIT_ENABLED = 'true';
	process.env.RATE_LIMIT_WHITELIST_IPS = '';
	process.env.RATE_LIMIT_TOKEN_MAX = '3';
	process.env.RATE_LIMIT_TOKEN_WINDOW_MS = '900000';
});

const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { supabaseAdmin, supabaseAnon } = await import('@/shared/config/supabase.js');
const { authMiddleware, optionalAuthMiddleware } =
	await import('@/features/auth/auth.middleware.js');
const { rateLimitConfig } = await import('@/shared/config/rate-limit.config.js');
const socketServer = await import('@/realtime/socket-server.js');
const { getIO } = await import('@/realtime/state.js');
const { configureTrustProxy } = await import('@/shared/config/trust-proxy.js');

// Failed token verifications limited per IP: HTTP through authMiddleware / optionalAuthMiddleware
// on a throwaway app, and the Socket.io handshake, against test Redis and local Supabase.

const KEY_PATTERN = 'rl:auth:token:*';
const PASSWORD = 'integration-test-password';
const MAX = 3;

async function clearKeys(): Promise<void> {
	const keys = await redisClient.keys(KEY_PATTERN);
	if (keys.length > 0) await redisClient.del(...keys);
}

describe('token verification limit per IP', () => {
	let httpServer: Server;
	let baseUrl: string;
	let userId: string;
	let validToken: string;
	const getUser = vi.spyOn(supabaseAdmin.auth, 'getUser');
	const clients: ClientSocket[] = [];

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');
		expect(rateLimitConfig.token.max).toBe(MAX);

		const email = `int-${randomUUID()}@example.com`;
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: PASSWORD,
			email_confirm: true,
		});
		if (error) throw error;
		userId = data.user.id;
		const { error: profileError } = await supabaseAdmin
			.from('user_profiles')
			.insert({ id: userId, username: `int_${userId.slice(0, 8)}` });
		if (profileError) throw profileError;
		const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
			email,
			password: PASSWORD,
		});
		if (signInError) throw signInError;
		validToken = session.session.access_token;

		const app = express();
		// As in server.ts; TRUST_PROXY is empty here.
		configureTrustProxy(app);
		const whoAmI = (req: Request) => (req as Request & { user?: { id: string } }).user?.id ?? null;
		app.get('/protected', authMiddleware, (req, res) => {
			res.json({ userId: whoAmI(req) });
		});
		app.get('/optional', optionalAuthMiddleware, (req, res) => {
			res.json({ userId: whoAmI(req) });
		});

		httpServer = createServer(app);
		socketServer.initialize(httpServer);
		await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
		const { port } = httpServer.address() as AddressInfo;
		baseUrl = `http://127.0.0.1:${port}`;
	});

	beforeEach(async () => {
		await clearKeys();
		getUser.mockClear();
	});

	afterEach(() => {
		while (clients.length) clients.pop()?.disconnect();
	});

	afterAll(async () => {
		try {
			if (isRedisConnected()) await clearKeys();
			await getIO()?.close();
			if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
		} finally {
			getUser.mockRestore();
			await disconnectRedis();
		}
	});

	const call = (path: string, token: string) =>
		fetch(`${baseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } });

	async function codeOf(res: Response): Promise<string> {
		const body = (await res.json()) as { error: { code: string } };
		return body.error.code;
	}

	function handshake(token: string, forwardedFor?: string): Promise<string> {
		const socket = ioClient(baseUrl, {
			auth: {
				token,
				deviceId: `dev-${randomUUID()}`,
				deviceName: 'Test device',
				platform: 'android',
				model: 'Pixel Test',
				appVersion: '1.0.0',
			},
			extraHeaders: forwardedFor ? { 'X-Forwarded-For': forwardedFor } : {},
			transports: ['websocket'],
			reconnection: false,
			forceNew: true,
		});
		clients.push(socket);
		return new Promise(resolve => {
			socket.once('connect', () => resolve('CONNECTED'));
			socket.once('connect_error', err => resolve(err.message));
		});
	}

	async function exhaust(): Promise<void> {
		for (let i = 0; i < MAX; i++) {
			const res = await call('/protected', `garbage-${i}`);
			expect(res.status).toBe(401);
			expect(await codeOf(res)).toBe('INVALID_TOKEN');
		}
	}

	it('lets a valid token through without counting it', async () => {
		const res = await call('/protected', validToken);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ userId });
		// The slot reserved for the verification is given back.
		const keys = await redisClient.keys(KEY_PATTERN);
		expect(keys).toHaveLength(1);
		expect(Number(await redisClient.get(keys[0]))).toBe(0);
	});

	it('counts failures with an expiry, then answers 429 without calling getUser', async () => {
		await exhaust();

		const keys = await redisClient.keys(KEY_PATTERN);
		expect(keys).toHaveLength(1);
		expect(Number(await redisClient.get(keys[0]))).toBe(MAX);
		const ttl = await redisClient.pttl(keys[0]);
		expect(ttl).toBeGreaterThan(0);
		expect(ttl).toBeLessThanOrEqual(rateLimitConfig.token.windowMs);
		expect(getUser).toHaveBeenCalledTimes(MAX);
		getUser.mockClear();

		const invalid = await call('/protected', 'garbage-more');
		expect(invalid.status).toBe(429);
		expect(await codeOf(invalid)).toBe('RATE_LIMIT_EXCEEDED');

		// Blocked for every token, valid or not.
		const valid = await call('/protected', validToken);
		expect(valid.status).toBe(429);
		const body = (await valid.json()) as {
			error: { code: string; details: { retryAfter: string } };
		};
		expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
		expect(new Date(body.error.details.retryAfter).getTime()).toBeGreaterThan(Date.now());

		expect(getUser).not.toHaveBeenCalled();
		// Refusals are not counted.
		expect(Number(await redisClient.get(keys[0]))).toBe(MAX);
	});

	it('continues anonymously on an optional route once blocked, without calling getUser', async () => {
		const before = await call('/optional', validToken);
		expect(await before.json()).toEqual({ userId });

		await exhaust();
		getUser.mockClear();

		const res = await call('/optional', validToken);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ userId: null });
		expect(getUser).not.toHaveBeenCalled();
	});

	it('refuses the socket handshake with TOO_MANY_ATTEMPTS without calling getUser', async () => {
		await expect(handshake(validToken)).resolves.toBe('CONNECTED');

		for (let i = 0; i < MAX; i++) {
			await expect(handshake(`garbage-${i}`)).resolves.toBe('INVALID_TOKEN');
		}
		getUser.mockClear();

		await expect(handshake(validToken)).resolves.toBe('TOO_MANY_ATTEMPTS');
		await expect(handshake('garbage-more')).resolves.toBe('TOO_MANY_ATTEMPTS');
		expect(getUser).not.toHaveBeenCalled();

		// HTTP and socket share the per-IP counter.
		const res = await call('/protected', validToken);
		expect(res.status).toBe(429);
	});

	it('verifies again once the window ends', async () => {
		await exhaust();
		const [key] = await redisClient.keys(KEY_PATTERN);
		await redisClient.pexpire(key, 50);
		await new Promise(resolve => setTimeout(resolve, 150));

		const res = await call('/protected', validToken);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ userId });
	});

	it('ignores a client-sent X-Forwarded-For without TRUST_PROXY (#173)', async () => {
		for (let i = 0; i < MAX; i++) {
			const res = await fetch(`${baseUrl}/protected`, {
				headers: { Authorization: `Bearer garbage-${i}`, 'X-Forwarded-For': `203.0.113.${i}` },
			});
			expect(res.status).toBe(401);
		}

		// Every request counted against the connection's address.
		expect(await redisClient.keys(KEY_PATTERN)).toHaveLength(1);
		const res = await fetch(`${baseUrl}/protected`, {
			headers: { Authorization: 'Bearer garbage-more', 'X-Forwarded-For': '203.0.113.99' },
		});
		expect(res.status).toBe(429);
		await expect(handshake('garbage-socket', '203.0.113.98')).resolves.toBe('TOO_MANY_ATTEMPTS');
	});
});
