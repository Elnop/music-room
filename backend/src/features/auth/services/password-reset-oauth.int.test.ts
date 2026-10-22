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
vi.mock('@/features/mail/mail.service.js', () => ({
	sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
	sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { supabaseAdmin, supabaseAnon } = await import('@/shared/config/supabase.js');
const { default: authRouter } = await import('@/features/auth/auth.routes.js');
const { errorHandler } = await import('@/shared/middleware/error-handler.js');
const { sendPasswordResetEmail } = await import('@/features/mail/mail.service.js');
const { createOAuthUser } = await import('@/features/auth/services/oauth-user.service.js');

// A Google/Facebook-only account (has_password false) can reset its password,
// which adds email/password sign-in to it (#189), through HTTP on the real auth
// router against the local Supabase stack and test Redis.

const NEW_PASSWORD = 'New-password-189';
const sendMail = vi.mocked(sendPasswordResetEmail);

describe('password reset for a Google/Facebook-only account (#189)', () => {
	let httpServer: Server;
	let baseUrl: string;
	let userId: string;
	let email: string;

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		// A real Google sign-up, as the app creates it (no password).
		email = `int-${randomUUID()}@example.com`;
		const { userProfile } = await createOAuthUser('google', `google-${randomUUID()}`, email, {
			name: 'OAuth Only',
		});
		userId = userProfile.id;

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

	it('creates a Google sign-up without a password', async () => {
		const { data, error } = await supabaseAdmin
			.from('user_profiles')
			.select('has_password, google_id')
			.eq('id', userId)
			.single();
		if (error) throw error;
		expect(data.has_password).toBe(false);
		expect(data.google_id).toEqual(expect.any(String));
	});

	it('sends a code, resets, records the password and allows password sign-in', async () => {
		expect((await post('/forgot-password', { email })).status).toBe(200);
		expect(sendMail).toHaveBeenCalledTimes(1);
		const [recipient, code] = sendMail.mock.calls[0];
		expect(recipient).toBe(email);

		const reset = await post('/reset-password', { email, code, newPassword: NEW_PASSWORD });
		expect(reset.status).toBe(200);

		const { data: profile, error } = await supabaseAdmin
			.from('user_profiles')
			.select('has_password, password_reset_code')
			.eq('id', userId)
			.single();
		if (error) throw error;
		expect(profile).toEqual({ has_password: true, password_reset_code: null });

		const { data: session, error: signInError } = await supabaseAnon.auth.signInWithPassword({
			email,
			password: NEW_PASSWORD,
		});
		expect(signInError).toBeNull();
		expect(session.user?.id).toBe(userId);
	});
});
