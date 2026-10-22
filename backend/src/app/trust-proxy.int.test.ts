import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Before env.ts is parsed: the loopback proxy is trusted, limiting on, nobody
// whitelisted, a low token limit.
vi.hoisted(() => {
	process.env.TRUST_PROXY = 'loopback';
	process.env.RATE_LIMIT_ENABLED = 'true';
	process.env.RATE_LIMIT_WHITELIST_IPS = '';
	process.env.RATE_LIMIT_TOKEN_MAX = '3';
	process.env.RATE_LIMIT_TOKEN_WINDOW_MS = '900000';
});

const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { authMiddleware } = await import('@/features/auth/auth.middleware.js');
const { configureTrustProxy } = await import('@/shared/config/trust-proxy.js');
const socketServer = await import('@/realtime/socket-server.js');
const { getIO } = await import('@/realtime/state.js');

// With a trusted proxy (#173), clients behind it are counted apart by their
// X-Forwarded-For, over HTTP and on the Socket.io handshake, against the test
// Redis and the local Supabase stack. The token limit (#160) is the witness.

const KEY_PATTERN = 'rl:auth:token:*';
const MAX = 3;
const CLIENT_A = '203.0.113.1';
const CLIENT_B = '203.0.113.2';

async function clearKeys(): Promise<void> {
	const keys = await redisClient.keys(KEY_PATTERN);
	if (keys.length > 0) await redisClient.del(...keys);
}

describe('client IP behind a trusted proxy (TRUST_PROXY=loopback)', () => {
	let httpServer: Server;
	let baseUrl: string;
	const clients: ClientSocket[] = [];

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		const app = express();
		configureTrustProxy(app);
		app.get('/protected', authMiddleware, (_req, res) => {
			res.json({ ok: true });
		});
		httpServer = createServer(app);
		socketServer.initialize(httpServer);
		await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
		baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
	});

	beforeEach(clearKeys);

	afterEach(() => {
		while (clients.length) clients.pop()?.disconnect();
	});

	afterAll(async () => {
		try {
			if (isRedisConnected()) await clearKeys();
			await getIO()?.close();
		} finally {
			await disconnectRedis();
		}
	});

	const call = (forwardedFor: string, token: string) =>
		fetch(`${baseUrl}/protected`, {
			headers: { Authorization: `Bearer ${token}`, 'X-Forwarded-For': forwardedFor },
		});

	function handshake(forwardedFor: string, token: string): Promise<string> {
		const socket = ioClient(baseUrl, {
			auth: {
				token,
				deviceId: `dev-${randomUUID()}`,
				deviceName: 'Test device',
				platform: 'android',
				model: 'Pixel Test',
				appVersion: '1.0.0',
			},
			extraHeaders: { 'X-Forwarded-For': forwardedFor },
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

	it('keeps separate HTTP counters per forwarded client', async () => {
		for (let i = 0; i < MAX; i++) {
			expect((await call(CLIENT_A, `garbage-${i}`)).status).toBe(401);
		}
		expect((await call(CLIENT_A, 'garbage-more')).status).toBe(429);

		expect((await call(CLIENT_B, 'garbage-b')).status).toBe(401);
		expect(await redisClient.keys(`rl:auth:token:${CLIENT_A}`)).toHaveLength(1);
		expect(await redisClient.keys(`rl:auth:token:${CLIENT_B}`)).toHaveLength(1);
	});

	it('keeps separate socket counters per forwarded client', async () => {
		for (let i = 0; i < MAX; i++) {
			await expect(handshake(CLIENT_A, `garbage-${i}`)).resolves.toBe('INVALID_TOKEN');
		}
		await expect(handshake(CLIENT_A, 'garbage-more')).resolves.toBe('TOO_MANY_ATTEMPTS');

		await expect(handshake(CLIENT_B, 'garbage-b')).resolves.toBe('INVALID_TOKEN');
	});
});
