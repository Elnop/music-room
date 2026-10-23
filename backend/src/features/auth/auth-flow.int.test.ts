import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Limiting on so the services' cooldowns are real; loopback whitelisted so the
// route-level limiters (not under test here) skip these requests.
vi.hoisted(() => {
	process.env.RATE_LIMIT_ENABLED = 'true';
	process.env.RATE_LIMIT_WHITELIST_IPS = '127.0.0.1,::1,::ffff:127.0.0.1';
});

// Never send real mail; read the codes from the mock instead.
vi.mock('@/features/mail/services/mail.service.js', () => ({
	sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
	sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { supabaseAdmin } = await import('@/shared/config/supabase.js');
const { sendVerificationEmail, sendPasswordResetEmail } =
	await import('@/features/mail/services/mail.service.js');
const { default: authRouter } = await import('@/features/auth/auth.routes.js');
const { errorHandler } = await import('@/shared/middleware/error-handler.js');

// The email/password journey end to end, through HTTP on the real auth router against the local
// Supabase stack and test Redis.

const PASSWORD = 'Flow-password-75';
const NEW_PASSWORD = 'Flow-renewed-75';
const verificationMail = vi.mocked(sendVerificationEmail);
const resetMail = vi.mocked(sendPasswordResetEmail);

describe('email/password auth flow (#75)', () => {
	let httpServer: Server;
	let baseUrl: string;
	const email = `int-${randomUUID()}@example.com`;
	const username = `int_${randomUUID().slice(0, 8)}`;
	let userId: string | undefined;
	const emails = [email];
	const userIds: string[] = [];

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

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
			if (userId) userIds.push(userId);
			if (isRedisConnected()) {
				const patterns = emails.flatMap(e => [
					`password_reset_*${e}*`,
					`failed_login:${e}:*`,
					`account_locked:${e}:*`,
				]);
				// Failed logins also count per IP (shared/security/ip-reputation.ts).
				patterns.push('ip_failed_logins:*127.0.0.1', 'ip_failed_logins:::1');
				patterns.push(...userIds.map(id => `email_*${id}*`));
				for (const pattern of patterns) {
					const keys = await redisClient.keys(pattern);
					if (keys.length > 0) await redisClient.del(...keys);
				}
			}
			await new Promise<void>(resolve => httpServer.close(() => resolve()));
			// Cascades to user_profiles.
			for (const id of userIds) await supabaseAdmin.auth.admin.deleteUser(id);
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

	const errorCode = (body: Record<string, unknown>) => (body.error as { code: string }).code;
	const accessToken = (body: Record<string, unknown>) =>
		(body.data as { session?: { accessToken?: string } }).session?.accessToken;

	it('refuses with 403 EMAIL_NOT_VERIFIED a confirmed auth user whose profile is unverified', async () => {
		// The state the app guard covers: Supabase lets the user sign in, the profile does not.
		const guardEmail = `int-${randomUUID()}@example.com`;
		emails.push(guardEmail);
		const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
			email: guardEmail,
			password: PASSWORD,
			email_confirm: true,
		});
		if (error) throw error;
		const id = created.user.id;
		userIds.push(id);
		const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
			id,
			username: `int_${id.slice(0, 8)}`,
			has_password: true,
			email_verified: false,
		});
		if (profileError) throw profileError;

		const { status, body } = await post('login', { email: guardEmail, password: PASSWORD });

		expect(status).toBe(403);
		expect(errorCode(body)).toBe('EMAIL_NOT_VERIFIED');
		expect(body.error).toMatchObject({ details: { userId: id, email: guardEmail } });
		expect(JSON.stringify(body)).not.toMatch(/accessToken|refreshToken/);
	});

	it('registers, refuses login until verified, verifies, then resets the password', async () => {
		const registered = await post('register', { email, password: PASSWORD, username });
		expect(registered.status).toBe(201);
		const data = registered.body.data as { user: { id: string }; requiresVerification: boolean };
		userId = data.user.id;
		expect(data.requiresVerification).toBe(true);
		expect(accessToken(registered.body)).toBeUndefined();

		// The auth user stays unconfirmed until the code is verified; the right password gets
		// 403 EMAIL_NOT_VERIFIED with what the app needs to resend.
		const wrongPassword = await post('login', { email, password: `${PASSWORD}-wrong` });
		expect(wrongPassword.status).toBe(401);
		expect(errorCode(wrongPassword.body)).toBe('INVALID_CREDENTIALS');
		const refused = await post('login', { email, password: PASSWORD });
		expect(refused.status).toBe(403);
		expect(errorCode(refused.body)).toBe('EMAIL_NOT_VERIFIED');
		expect(refused.body).toMatchObject({ error: { details: { userId, email } } });
		expect(JSON.stringify(refused.body)).not.toMatch(/accessToken|refreshToken/);

		verificationMail.mockClear();
		const resent = await post('resend-verification', { userId, email });
		expect(resent.status).toBe(200);
		expect(verificationMail).toHaveBeenCalledTimes(1);
		const [recipient, code] = verificationMail.mock.calls[0];
		expect(recipient).toBe(email);

		const verified = await post('verify-email', { userId, code });
		expect(verified.status).toBe(200);
		expect(accessToken(verified.body)).toEqual(expect.any(String));

		const loggedIn = await post('login', { email, password: PASSWORD });
		expect(loggedIn.status).toBe(200);
		expect(accessToken(loggedIn.body)).toEqual(expect.any(String));

		resetMail.mockClear();
		const forgot = await post('forgot-password', { email });
		expect(forgot.status).toBe(200);
		expect(resetMail).toHaveBeenCalledTimes(1);
		const [resetRecipient, resetCode] = resetMail.mock.calls[0];
		expect(resetRecipient).toBe(email);

		const reset = await post('reset-password', {
			email,
			code: resetCode,
			newPassword: NEW_PASSWORD,
		});
		expect(reset.status).toBe(200);

		const oldPassword = await post('login', { email, password: PASSWORD });
		expect(oldPassword.status).toBe(401);
		expect(errorCode(oldPassword.body)).toBe('INVALID_CREDENTIALS');

		const newPassword = await post('login', { email, password: NEW_PASSWORD });
		expect(newPassword.status).toBe(200);
		expect(accessToken(newPassword.body)).toEqual(expect.any(String));
	});
});
