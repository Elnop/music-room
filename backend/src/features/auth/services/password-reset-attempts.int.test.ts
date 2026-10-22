import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Limiting on so the attempts limit is real; loopback whitelisted so the
// route-level limiters (not under test here) skip these requests.
vi.hoisted(() => {
	process.env.RATE_LIMIT_ENABLED = 'true';
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
const { default: authRouter } = await import('@/features/auth/auth.routes.js');
const { errorHandler } = await import('@/shared/middleware/error-handler.js');
const loginService = await import('@/features/auth/services/login.service.js');

// The password reset code has a max attempts limit that runs before the code
// check (threat model L9, #206), through HTTP on the real auth router against
// the local Supabase stack and test Redis.

const PASSWORD = 'Old-password-206';
const NEW_PASSWORD = 'New-password-206';
const RESET_CODE = '482913';
const MAX_ATTEMPTS = 5; // MAX_RESET_ATTEMPTS in password-reset.service.ts

describe('password reset code attempts limit (#206)', () => {
	let httpServer: Server;
	let baseUrl: string;
	let userId: string;
	let email: string;

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		email = `int-reset-${randomUUID()}@example.com`;
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: PASSWORD,
			email_confirm: true,
		});
		if (error) throw error;
		userId = data.user.id;

		const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
			id: userId,
			username: `int_${userId.slice(0, 8)}`,
			has_password: true,
			email_verified: true,
			password_reset_code: RESET_CODE,
			password_reset_code_expires_at: new Date(Date.now() + 15 * 60_000).toISOString(),
		});
		if (profileError) throw profileError;

		const app = express();
		app.use(express.json());
		app.use('/api/auth', authRouter);
		app.use(errorHandler);
		httpServer = createServer(app);
		await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
		baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
	});

	afterAll(async () => {
		try {
			if (isRedisConnected() && email) {
				const keys = await redisClient.keys(`password_reset_*:${email}:*`);
				if (keys.length > 0) await redisClient.del(...keys);
			}
			if (httpServer) await new Promise<void>(resolve => httpServer.close(() => resolve()));
			// Cascades to user_profiles.
			if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
		} finally {
			await disconnectRedis();
		}
	});

	async function resetPassword(code: string) {
		const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email, code, newPassword: NEW_PASSWORD }),
		});
		const body = (await res.json()) as { error?: { code: string } };
		return { status: res.status, code: body.error?.code };
	}

	it('refuses even the right code once the attempt limit is reached', async () => {
		for (let i = 0; i < MAX_ATTEMPTS; i++) {
			expect(await resetPassword('111111')).toEqual({ status: 400, code: 'INVALID_RESET_CODE' });
		}

		expect(await resetPassword(RESET_CODE)).toEqual({ status: 429, code: 'RATE_LIMIT_EXCEEDED' });

		// The code is still stored and the password is unchanged.
		const { data, error } = await supabaseAdmin
			.from('user_profiles')
			.select('password_reset_code')
			.eq('id', userId)
			.single();
		if (error) throw error;
		expect(data.password_reset_code).toBe(RESET_CODE);
		const { user } = await loginService.login({ email, password: PASSWORD });
		expect(user.id).toBe(userId);
	});
});
