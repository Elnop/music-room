import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Limiting on, loopback whitelisted so the route-level limiters skip these requests.
vi.hoisted(() => {
	process.env.RATE_LIMIT_ENABLED = 'true';
	process.env.RATE_LIMIT_WHITELIST_IPS = '127.0.0.1,::1,::ffff:127.0.0.1';
});

// Never send real mail; capture the code instead.
vi.mock('@/features/mail/services/mail.service.js', () => ({
	sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
	sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

// Token verification calls Google and Facebook: always mocked (doc/development/testing.md).
vi.mock('@/features/auth/services/oauth.service.js', () => ({
	verifyGoogleToken: vi.fn(),
	verifyFacebookToken: vi.fn(),
}));

const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { supabaseAdmin } = await import('@/shared/config/supabase.js');
const { default: authRouter } = await import('@/features/auth/auth.routes.js');
const { errorHandler } = await import('@/shared/middleware/error-handler.js');
const { sendPasswordResetEmail } = await import('@/features/mail/services/mail.service.js');
const loginService = await import('@/features/auth/services/login.service.js');
const sessionService = await import('@/features/auth/services/session.service.js');

// A password reset ends every open session of the account (#203), through HTTP
// on the real auth router against the local Supabase stack and test Redis.

const OLD_PASSWORD = 'Old-password-203';
const NEW_PASSWORD = 'New-password-203';
const sendMail = vi.mocked(sendPasswordResetEmail);

describe('password reset ends open sessions (#203)', () => {
	let httpServer: Server;
	let baseUrl: string;
	let userId: string;
	let email: string;

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		email = `int-${randomUUID()}@example.com`;
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: OLD_PASSWORD,
			email_confirm: true,
		});
		if (error) throw error;
		userId = data.user.id;

		const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
			id: userId,
			username: `int_${userId.slice(0, 8)}`,
			has_password: true,
			email_verified: true,
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
			const keys = await redisClient.keys(`password_reset_*${email}*`);
			if (keys.length > 0) await redisClient.del(...keys);
			await new Promise<void>(resolve => httpServer.close(() => resolve()));
			// Cascades to user_profiles.
			if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
		} finally {
			await disconnectRedis();
		}
	});

	const post = (path: string, body: object) =>
		fetch(`${baseUrl}/api/auth${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});

	it('refuses the access and refresh tokens issued before the reset', async () => {
		const login = async (password: string) => {
			const { session } = await loginService.login({ email, password });
			if (!session) throw new Error('login returned no session');
			return session;
		};
		const first = await login(OLD_PASSWORD);
		const second = await login(OLD_PASSWORD);

		expect((await post('/forgot-password', { email })).status).toBe(200);
		const [, code] = sendMail.mock.calls[0];
		const reset = await post('/reset-password', { email, code, newPassword: NEW_PASSWORD });
		expect(reset.status).toBe(200);

		for (const session of [first, second]) {
			await expect(sessionService.verifyToken(session.accessToken)).rejects.toMatchObject({
				statusCode: 401,
			});
			await expect(sessionService.refreshToken(session.refreshToken)).rejects.toMatchObject({
				statusCode: 401,
				code: 'INVALID_REFRESH_TOKEN',
			});
		}

		// A new sign-in with the new password still works.
		const fresh = await login(NEW_PASSWORD);
		const refreshed = await sessionService.refreshToken(fresh.refreshToken);
		expect(refreshed.user.id).toBe(userId);
	});
});
