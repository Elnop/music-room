import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Before env.ts is parsed: limiting on, nobody whitelisted, default login limits.
vi.hoisted(() => {
	process.env.RATE_LIMIT_ENABLED = 'true';
	process.env.RATE_LIMIT_WHITELIST_IPS = '';
});

const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { loginRateLimiter } = await import('@/shared/security/http-rate-limit.js');
const { rateLimitConfig } = await import('@/shared/config/rate-limit.config.js');
const { errorHandler } = await import('@/shared/middleware/error-handler.js');

const KEY_PATTERN = 'rl:auth:login:*';

async function loginKeys(email: string): Promise<string[]> {
	const keys = await redisClient.keys(KEY_PATTERN);
	return keys.filter(key => key.includes(email));
}

describe('login rate limiter counts in Redis (test Redis from scripts/test-db.sh)', () => {
	let server: Server;
	let baseUrl: string;
	const email = `rl-${randomUUID()}@example.com`;

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		// Throwaway app: every login attempt fails, so each one is counted.
		const app = express();
		app.use(express.json());
		app.post('/login', loginRateLimiter, (_req, res) => {
			res.status(401).json({ success: false });
		});
		app.use(errorHandler);

		server = createServer(app);
		await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
		const { port } = server.address() as AddressInfo;
		baseUrl = `http://127.0.0.1:${port}`;
	});

	afterAll(async () => {
		try {
			if (isRedisConnected()) {
				const keys = await loginKeys(email);
				if (keys.length > 0) await redisClient.del(...keys);
			}
			if (server) await new Promise<void>(resolve => server.close(() => resolve()));
		} finally {
			// Always stop the reconnect loop, even when beforeAll failed.
			await disconnectRedis();
		}
	});

	const attempt = () =>
		fetch(`${baseUrl}/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, password: 'wrong' }),
		});

	it('stores failed attempts under rl:auth:login: and answers 429 past the limit', async () => {
		const max = rateLimitConfig.login.max;

		for (let i = 0; i < max; i++) {
			const res = await attempt();
			expect(res.status).toBe(401);
		}

		const keys = await loginKeys(email);
		expect(keys).toHaveLength(1);
		expect(keys[0]).toMatch(/^rl:auth:login:login:/);
		expect(Number(await redisClient.get(keys[0]))).toBe(max);

		const blocked = await attempt();
		expect(blocked.status).toBe(429);
		const body = (await blocked.json()) as { error: { code: string } };
		expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
	});
});
