import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Before env.ts is parsed: lockout and limiting on, a low IP blacklist threshold,
// loopback whitelisted so the express-rate-limit limiters (not under test) skip.
// The whitelist does not reach bruteForceService.
vi.hoisted(() => {
	process.env.RATE_LIMIT_ENABLED = 'true';
	process.env.ACCOUNT_LOCKOUT_ENABLED = 'true';
	process.env.ACCOUNT_LOCKOUT_THRESHOLD = '5';
	process.env.IP_BLACKLIST_THRESHOLD = '7';
	process.env.RATE_LIMIT_WHITELIST_IPS = '127.0.0.1,::1,::ffff:127.0.0.1';
});

// Never send real mail.
vi.mock('@/features/mail/services/mail.service.js', () => ({
	sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
	sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { supabaseAdmin } = await import('@/shared/config/supabase.js');
const { rateLimitConfig } = await import('@/shared/config/rate-limit.config.js');
const { default: authRouter } = await import('@/features/auth/auth.routes.js');
const { errorHandler } = await import('@/shared/middleware/error-handler.js');

// Account lockout and IP blacklist (threat model L9, #206), through HTTP on the
// real auth router against the local Supabase stack and test Redis.

const PASSWORD = 'integration-test-password';
const WRONG_PASSWORD = 'wrong-password';
const LOOPBACK_IPS = ['127.0.0.1', '::1', '::ffff:127.0.0.1'];
const createdUserIds: string[] = [];
const usedEmails: string[] = [];

async function createVerifiedUser(): Promise<string> {
	const email = `int-lockout-${randomUUID()}@example.com`;
	usedEmails.push(email);
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: PASSWORD,
		email_confirm: true,
	});
	if (error) throw error;
	const id = data.user.id;
	createdUserIds.push(id);

	const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
		id,
		username: `int_${id.slice(0, 8)}`,
		has_password: true,
		email_verified: true,
	});
	if (profileError) throw profileError;
	return email;
}

async function deleteKeys(pattern: string): Promise<void> {
	const keys = await redisClient.keys(pattern);
	if (keys.length > 0) await redisClient.del(...keys);
}

// Every key bruteForceService writes for these emails and for loopback.
async function clearBruteForceKeys(): Promise<void> {
	for (const email of usedEmails) {
		await deleteKeys(`failed_login:${email}:*`);
		await deleteKeys(`account_locked:${email}:*`);
		// Only written when the blacklist lets forgot-password through.
		await deleteKeys(`password_reset_*:${email}:*`);
	}
	for (const ip of LOOPBACK_IPS) {
		await redisClient.del(`ip_failed_logins:${ip}`, `ip_blacklist:${ip}`);
	}
}

describe('account lockout and IP blacklist (#206)', () => {
	let httpServer: Server;
	let baseUrl: string;

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		const app = express();
		app.use(express.json());
		app.use('/api/auth', authRouter);
		app.use(errorHandler);
		httpServer = createServer(app);
		await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
		const { port } = httpServer.address() as AddressInfo;
		baseUrl = `http://127.0.0.1:${port}`;
	});

	beforeEach(async () => {
		await clearBruteForceKeys();
	});

	afterAll(async () => {
		try {
			if (isRedisConnected()) await clearBruteForceKeys();
			if (httpServer) await new Promise<void>(resolve => httpServer.close(() => resolve()));
			// Cascades to user_profiles.
			for (const id of createdUserIds) await supabaseAdmin.auth.admin.deleteUser(id);
		} finally {
			await disconnectRedis();
		}
	});

	async function post(path: string, body: unknown) {
		const res = await fetch(`${baseUrl}/api/auth/${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});
		return { status: res.status, body: (await res.json()) as Record<string, unknown> };
	}

	const login = (email: string, password: string) => post('login', { email, password });

	const error = (body: Record<string, unknown>) =>
		body.error as { code: string; details?: { lockedUntil?: string; remainingTime?: number } };

	it('locks the account after the threshold and refuses even the right password', async () => {
		const email = await createVerifiedUser();
		const threshold = rateLimitConfig.lockout.threshold;
		expect(threshold).toBe(5);

		for (let i = 0; i < threshold; i++) {
			const { status, body } = await login(email, WRONG_PASSWORD);
			expect(status).toBe(401);
			expect(error(body).code).toBe('INVALID_CREDENTIALS');
		}

		const { status, body } = await login(email, PASSWORD);

		expect(status).toBe(429);
		expect(error(body).code).toBe('ACCOUNT_LOCKED');
		expect(new Date(error(body).details?.lockedUntil ?? '').getTime()).toBeGreaterThan(Date.now());
		expect(error(body).details?.remainingTime).toBeGreaterThan(0);
		expect(body.data).toBeUndefined();
		expect(JSON.stringify(body)).not.toMatch(/accessToken|refreshToken/);
	});

	it('clears the failed attempts on a successful login', async () => {
		const email = await createVerifiedUser();

		for (let i = 0; i < 2; i++) {
			expect((await login(email, WRONG_PASSWORD)).status).toBe(401);
		}
		expect(await redisClient.keys(`failed_login:${email}:*`)).toHaveLength(1);

		const { status } = await login(email, PASSWORD);

		expect(status).toBe(200);
		expect(await redisClient.keys(`failed_login:${email}:*`)).toHaveLength(0);
	});

	it('blacklists the IP after the threshold and refuses every auth request from it', async () => {
		const email = await createVerifiedUser();
		const threshold = rateLimitConfig.ipReputation.blacklistThreshold;
		expect(threshold).toBe(7);

		// A new email each time: the per-account lockout never triggers.
		for (let i = 0; i < threshold; i++) {
			const stranger = `int-lockout-${randomUUID()}@example.com`;
			usedEmails.push(stranger);
			expect((await login(stranger, WRONG_PASSWORD)).status).toBe(401);
		}

		const valid = await login(email, PASSWORD);
		expect(valid.status).toBe(403);
		expect(error(valid.body).code).toBe('IP_BLOCKED');
		expect(JSON.stringify(valid.body)).not.toMatch(/accessToken|refreshToken/);

		const other = await post('forgot-password', { email });
		expect(other.status).toBe(403);
		expect(error(other.body).code).toBe('IP_BLOCKED');
	});
});
