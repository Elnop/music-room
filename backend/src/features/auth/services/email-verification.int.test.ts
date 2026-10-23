import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Limiting on so the service's resend cooldown is real; loopback whitelisted so
// the route-level limiters (not under test here) skip these requests.
vi.hoisted(() => {
	process.env.RATE_LIMIT_ENABLED = 'true';
	process.env.RATE_LIMIT_WHITELIST_IPS = '127.0.0.1,::1,::ffff:127.0.0.1';
});

// Never send real mail; capture the recipient and the code instead.
vi.mock('@/features/mail/services/mail.service.js', () => ({
	sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
	sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { supabaseAdmin } = await import('@/shared/config/supabase.js');
const { sendVerificationEmail } = await import('@/features/mail/services/mail.service.js');
const { default: authRouter } = await import('@/features/auth/auth.routes.js');
const { errorHandler } = await import('@/shared/middleware/error-handler.js');
const { logger } = await import('@/shared/utils/logger.js');
const { verificationConfig } = await import('@/features/mail/mail.config.js');

// verify-email and resend-verification cannot hand out an account, through HTTP on the real
// auth router against the local Supabase stack and test Redis.

const PASSWORD = 'integration-test-password';
const SENT_MESSAGE = 'Verification code sent. Please check your email.';
const createdUserIds: string[] = [];
const sendMail = vi.mocked(sendVerificationEmail);
const logInfo = vi.spyOn(logger, 'info');
const logWarn = vi.spyOn(logger, 'warn');

interface Staged {
	id: string;
	email: string;
}

async function createUser(profile: {
	email_verified: boolean;
	verification_code?: string | null;
}): Promise<Staged> {
	const email = `int-${randomUUID()}@example.com`;
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: PASSWORD,
		email_confirm: true,
	});
	if (error) throw error;
	const id = data.user.id;
	createdUserIds.push(id);

	const code = profile.verification_code ?? null;
	const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
		id,
		username: `int_${id.slice(0, 8)}`,
		has_password: true,
		email_verified: profile.email_verified,
		verification_code: code,
		verification_code_expires_at: code ? new Date(Date.now() + 10 * 60_000).toISOString() : null,
	});
	if (profileError) throw profileError;
	return { id, email };
}

async function storedCode(userId: string): Promise<string | null> {
	const { data, error } = await supabaseAdmin
		.from('user_profiles')
		.select('verification_code')
		.eq('id', userId)
		.single();
	if (error) throw error;
	return data.verification_code;
}

async function clearRedisKeys(): Promise<void> {
	for (const id of createdUserIds) {
		const keys = await redisClient.keys(`email_*${id}*`);
		if (keys.length > 0) await redisClient.del(...keys);
	}
}

describe('email verification cannot take over an account (#188)', () => {
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

	beforeEach(() => {
		sendMail.mockClear();
		logInfo.mockClear();
		logWarn.mockClear();
	});

	afterAll(async () => {
		try {
			if (isRedisConnected()) await clearRedisKeys();
			await new Promise<void>(resolve => httpServer.close(() => resolve()));
			// Cascades to user_profiles.
			for (const id of createdUserIds) await supabaseAdmin.auth.admin.deleteUser(id);
		} finally {
			logInfo.mockRestore();
			logWarn.mockRestore();
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

	describe('POST /verify-email', () => {
		it('refuses a verified account with ALREADY_VERIFIED and returns no session', async () => {
			const user = await createUser({ email_verified: true });

			const { status, body } = await post('verify-email', { userId: user.id, code: '123456' });

			expect(status).toBe(400);
			expect(errorCode(body)).toBe('ALREADY_VERIFIED');
			expect(body.data).toBeUndefined();
			expect(JSON.stringify(body)).not.toMatch(/accessToken|refreshToken/);
		});

		it('verifies an unverified account with its stored code and returns a session', async () => {
			const user = await createUser({ email_verified: false, verification_code: '482913' });

			const { status, body } = await post('verify-email', { userId: user.id, code: '482913' });

			expect(status).toBe(200);
			const data = body.data as {
				user: { id: string; email: string };
				session: { accessToken: string; refreshToken: string };
			};
			expect(data.user).toMatchObject({ id: user.id, email: user.email });
			expect(data.session.accessToken).toEqual(expect.any(String));
			expect(data.session.refreshToken).toEqual(expect.any(String));
			expect(await storedCode(user.id)).toBeNull();
		});

		it('refuses a wrong code with INVALID_CODE', async () => {
			const user = await createUser({ email_verified: false, verification_code: '482913' });

			const { status, body } = await post('verify-email', { userId: user.id, code: '111111' });

			expect(status).toBe(400);
			expect(errorCode(body)).toBe('INVALID_CODE');
			expect(body.data).toBeUndefined();
		});

		it('refuses even the right code once the attempt limit is reached (#206)', async () => {
			const user = await createUser({ email_verified: false, verification_code: '482913' });
			const maxAttempts = verificationConfig.maxAttempts;
			expect(maxAttempts).toBe(5);

			for (let i = 0; i < maxAttempts; i++) {
				const { status, body } = await post('verify-email', { userId: user.id, code: '111111' });
				expect(status).toBe(400);
				expect(errorCode(body)).toBe('INVALID_CODE');
			}

			const { status, body } = await post('verify-email', { userId: user.id, code: '482913' });

			expect(status).toBe(429);
			expect(errorCode(body)).toBe('RATE_LIMIT_EXCEEDED');
			expect(JSON.stringify(body)).not.toMatch(/accessToken|refreshToken/);
			const { data, error } = await supabaseAdmin
				.from('user_profiles')
				.select('email_verified')
				.eq('id', user.id)
				.single();
			if (error) throw error;
			expect(data.email_verified).toBe(false);
			expect(await storedCode(user.id)).toBe('482913');
		});
	});

	describe('POST /resend-verification', () => {
		it("sends a new code to the account's auth email when the body email matches (any case)", async () => {
			const user = await createUser({ email_verified: false, verification_code: '482913' });

			const { status, body } = await post('resend-verification', {
				userId: user.id,
				email: user.email.toUpperCase(),
			});

			expect(status).toBe(200);
			expect((body.data as { message: string }).message).toBe(SENT_MESSAGE);
			expect(sendMail).toHaveBeenCalledTimes(1);
			const [recipient, code] = sendMail.mock.calls[0];
			expect(recipient).toBe(user.email);
			expect(await storedCode(user.id)).toBe(code);
			expect(code).not.toBe('482913');
		});

		it('sends nothing when the body email is not the account email', async () => {
			const user = await createUser({ email_verified: false, verification_code: '482913' });

			const { status, body } = await post('resend-verification', {
				userId: user.id,
				email: `attacker-${randomUUID()}@example.com`,
			});

			expect(status).toBe(200);
			expect((body.data as { message: string }).message).toBe(SENT_MESSAGE);
			expect(sendMail).not.toHaveBeenCalled();
			expect(await storedCode(user.id)).toBe('482913');
			expect(logWarn).toHaveBeenCalledWith(
				'Resend verification: email does not match the account',
				{ userId: user.id }
			);
		});

		it('answers 429 RESEND_COOLDOWN on a second call even when the email does not match', async () => {
			const user = await createUser({ email_verified: false, verification_code: '482913' });
			const body = { userId: user.id, email: `attacker-${randomUUID()}@example.com` };

			const first = await post('resend-verification', body);
			const second = await post('resend-verification', body);

			expect(first.status).toBe(200);
			expect(second.status).toBe(429);
			expect(errorCode(second.body)).toBe('RESEND_COOLDOWN');
			expect(sendMail).not.toHaveBeenCalled();
		});

		it('sends nothing for an already verified account', async () => {
			const user = await createUser({ email_verified: true });

			const { status, body } = await post('resend-verification', {
				userId: user.id,
				email: user.email,
			});

			expect(status).toBe(200);
			expect((body.data as { message: string }).message).toBe(SENT_MESSAGE);
			expect(sendMail).not.toHaveBeenCalled();
			expect(await storedCode(user.id)).toBeNull();
		});

		it('sends nothing for an unknown user', async () => {
			const userId = randomUUID();
			createdUserIds.push(userId); // only for the Redis key cleanup
			const { status, body } = await post('resend-verification', {
				userId,
				email: `nobody-${randomUUID()}@example.com`,
			});

			expect(status).toBe(200);
			expect((body.data as { message: string }).message).toBe(SENT_MESSAGE);
			expect(sendMail).not.toHaveBeenCalled();
			expect(logInfo).toHaveBeenCalledWith('Resend verification: no such account', { userId });
		});
	});
});
