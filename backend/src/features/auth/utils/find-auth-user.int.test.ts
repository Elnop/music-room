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

// Token verification calls Google and Facebook: always mocked (doc/TESTING.md).
vi.mock('@/features/auth/services/oauth.service.js', () => ({
	OAuthService: {
		verifyGoogleToken: vi.fn(),
		verifyFacebookToken: vi.fn(),
	},
}));

const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { supabaseAdmin } = await import('@/shared/config/supabase.js');
const { default: authRouter } = await import('@/features/auth/auth.routes.js');
const { errorHandler } = await import('@/shared/middleware/error-handler.js');
const { sendPasswordResetEmail } = await import('@/features/mail/mail.service.js');
const { AuthService } = await import('@/features/auth/auth.service.js');
const { findAuthUserIdByEmail } = await import('@/features/auth/utils/find-auth-user.js');

// The account is found past the first page of auth.admin.listUsers() (50 users)
// and whatever the case of the email (#194), against the local Supabase stack.

// More than one listUsers() page (50 users).
const FILLER_USERS = 51;
const NEW_PASSWORD = 'New-password-194';
const sendMail = vi.mocked(sendPasswordResetEmail);

describe('auth user lookup by email past the first listUsers() page (#194)', () => {
	let httpServer: Server;
	let baseUrl: string;
	let userId: string;
	let email: string;
	const createdUserIds: string[] = [];

	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');

		// listUsers() lists the newest accounts first: create this one before the
		// fillers, so it sits past the first page.
		email = `int-${randomUUID()}@example.com`;
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: 'Old-password-194',
			email_confirm: true,
		});
		if (error) throw error;
		userId = data.user.id;
		createdUserIds.push(userId);

		const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
			id: userId,
			username: `int_${userId.slice(0, 8)}`,
			has_password: true,
			email_verified: true,
		});
		if (profileError) throw profileError;

		for (let i = 0; i < FILLER_USERS; i += 10) {
			const batch = Array.from({ length: Math.min(10, FILLER_USERS - i) }, async () => {
				const { data, error } = await supabaseAdmin.auth.admin.createUser({
					email: `int-filler-${randomUUID()}@example.com`,
					password: 'filler-password',
					email_confirm: true,
				});
				if (error) throw error;
				createdUserIds.push(data.user.id);
			});
			await Promise.all(batch);
		}

		const { data: firstPage, error: listError } = await supabaseAdmin.auth.admin.listUsers();
		if (listError) throw listError;
		expect(firstPage.users.some(u => u.id === userId)).toBe(false);

		const app = express();
		app.use(express.json());
		app.use('/api/auth', authRouter);
		app.use(errorHandler);
		httpServer = createServer(app);
		await new Promise<void>(resolve => httpServer.listen(0, '127.0.0.1', () => resolve()));
		baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
	}, 60_000);

	afterAll(async () => {
		try {
			const keys = await redisClient.keys(`password_reset_*${email.toLowerCase()}*`);
			if (keys.length > 0) await redisClient.del(...keys);
			if (httpServer) await new Promise<void>(resolve => httpServer.close(() => resolve()));
			// Cascades to user_profiles.
			for (const id of createdUserIds) await supabaseAdmin.auth.admin.deleteUser(id);
		} finally {
			await disconnectRedis();
		}
	}, 60_000);

	const post = (path: string, body: object) =>
		fetch(`${baseUrl}/api/auth${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		});

	it('finds the account ignoring case, and returns null for an unknown email', async () => {
		await expect(findAuthUserIdByEmail(email.toUpperCase())).resolves.toBe(userId);
		await expect(findAuthUserIdByEmail(`int-${randomUUID()}@example.com`)).resolves.toBeNull();
	});

	it('sends a reset code and resets the password, whatever the case of the email', async () => {
		expect((await post('/forgot-password', { email: email.toUpperCase() })).status).toBe(200);
		expect(sendMail).toHaveBeenCalledTimes(1);
		const [recipient, code] = sendMail.mock.calls[0];
		expect(recipient).toBe(email.toUpperCase());

		const reset = await post('/reset-password', {
			email: email.charAt(0).toUpperCase() + email.slice(1),
			code,
			newPassword: NEW_PASSWORD,
		});
		expect(reset.status).toBe(200);

		const { session } = await new AuthService().login({ email, password: NEW_PASSWORD });
		expect(session?.accessToken).toEqual(expect.any(String));
	});

	it('refuses a sign-up with the email of a verified account, whatever its case', async () => {
		await expect(
			new AuthService().register({
				email: email.toUpperCase(),
				password: 'Another-password-194',
				username: `int_dup_${randomUUID().slice(0, 8)}`,
			})
		).rejects.toMatchObject({ statusCode: 409, code: 'EMAIL_ALREADY_EXISTS' });
	});

	it('counts reset attempts once per account across case variants of the email', async () => {
		const variants = [email, email.toUpperCase()];
		for (let i = 0; i < 5; i++) {
			const res = await post('/reset-password', {
				email: variants[i % 2],
				code: '000000',
				newPassword: NEW_PASSWORD,
			});
			expect(res.status).toBe(400);
		}
		const blocked = await post('/reset-password', {
			email: email.toUpperCase(),
			code: '000000',
			newPassword: NEW_PASSWORD,
		});
		expect(blocked.status).toBe(429);
	});
});
