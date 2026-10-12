import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

// Limiting on so the reset cooldown is real; loopback whitelisted so the
// route-level limiters (not under test here) skip these requests.
vi.hoisted(() => {
	process.env.RATE_LIMIT_ENABLED = 'true';
	process.env.RATE_LIMIT_WHITELIST_IPS = '127.0.0.1,::1,::ffff:127.0.0.1';
});

// Never send real mail.
vi.mock('@/features/mail/mail.service.js', () => ({
	sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
	sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

const { connectRedis, disconnectRedis, isRedisConnected, redisClient } =
	await import('@/shared/config/redis.js');
const { supabaseAdmin } = await import('@/shared/config/supabase.js');
const { default: authRouter } = await import('@/features/auth/auth.routes.js');
const { errorHandler } = await import('@/shared/middleware/error-handler.js');
const { sendPasswordResetEmail } = await import('@/features/mail/mail.service.js');

// GET /api/auth/reset-password/can-resend validates its query and reports the
// cooldown each forgot-password request starts (#187), through HTTP on the real
// auth router against the local Supabase stack and test Redis.

const COOLDOWN_SECONDS = 60;
const createdUserIds: string[] = [];
const usedEmails: string[] = [];

function newEmail(): string {
	const email = `int-${randomUUID()}@example.com`;
	usedEmails.push(email);
	return email;
}

async function clearRedisKeys(): Promise<void> {
	for (const email of usedEmails) {
		const keys = await redisClient.keys(`password_reset_*${email.toLowerCase()}*`);
		if (keys.length > 0) await redisClient.del(...keys);
	}
}

describe('password reset resend cooldown (#187)', () => {
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
		baseUrl = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;
	});

	afterAll(async () => {
		try {
			await clearRedisKeys();
			await new Promise<void>(resolve => httpServer.close(() => resolve()));
			for (const id of createdUserIds) await supabaseAdmin.auth.admin.deleteUser(id);
		} finally {
			await disconnectRedis();
		}
	});

	interface CanResendBody {
		data: { canResend: boolean; remainingSeconds: number };
	}
	const cooldown = async (res: Response) => ((await res.json()) as CanResendBody).data;

	const canResend = (email: string) =>
		fetch(`${baseUrl}/api/auth/reset-password/can-resend?email=${encodeURIComponent(email)}`);

	const forgotPassword = (email: string) =>
		fetch(`${baseUrl}/api/auth/forgot-password`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email }),
		});

	it('answers 400 VALIDATION_ERROR for a missing or malformed email', async () => {
		for (const url of [
			`${baseUrl}/api/auth/reset-password/can-resend`,
			`${baseUrl}/api/auth/reset-password/can-resend?email=not-an-email`,
		]) {
			const res = await fetch(url);
			expect(res.status).toBe(400);
			expect(await res.json()).toMatchObject({ error: { code: 'VALIDATION_ERROR' } });
		}
	});

	it('allows a resend before any forgot-password request', async () => {
		const res = await canResend(newEmail());

		expect(res.status).toBe(200);
		expect(await cooldown(res)).toEqual({ canResend: true, remainingSeconds: 0 });
	});

	it('reports the cooldown after forgot-password for an existing account', async () => {
		const email = newEmail();
		const { data, error } = await supabaseAdmin.auth.admin.createUser({
			email,
			password: 'Integration-test-1',
			email_confirm: true,
		});
		if (error) throw error;
		createdUserIds.push(data.user.id);
		const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
			id: data.user.id,
			username: `int_${data.user.id.slice(0, 8)}`,
			has_password: true,
		});
		if (profileError) throw profileError;

		expect((await forgotPassword(email)).status).toBe(200);

		// The account path ran: a reset code was mailed to it.
		expect(vi.mocked(sendPasswordResetEmail)).toHaveBeenCalledWith(
			email,
			expect.stringMatching(/^\d{6}$/),
			expect.any(Number)
		);
		const body = await cooldown(await canResend(email));
		expect(body.canResend).toBe(false);
		expect(body.remainingSeconds).toBeGreaterThan(0);
		expect(body.remainingSeconds).toBeLessThanOrEqual(COOLDOWN_SECONDS);
	});

	it('reports the hourly limit once three requests were made', async () => {
		const email = newEmail();
		for (let i = 0; i < 3; i++) expect((await forgotPassword(email)).status).toBe(200);
		expect((await forgotPassword(email)).status).toBe(429);

		const body = await cooldown(await canResend(email));
		expect(body.canResend).toBe(false);
		expect(body.remainingSeconds).toBeGreaterThan(COOLDOWN_SECONDS);
	});

	it('uses one cooldown whatever the email case', async () => {
		const email = newEmail();
		expect((await forgotPassword(email.toUpperCase())).status).toBe(200);

		expect((await cooldown(await canResend(email))).canResend).toBe(false);
	});

	it('reports the same cooldown for an email with no account (no enumeration)', async () => {
		const email = newEmail();

		expect((await forgotPassword(email)).status).toBe(200);

		const body = await cooldown(await canResend(email));
		expect(body.canResend).toBe(false);
		expect(body.remainingSeconds).toBeGreaterThan(0);
		expect(body.remainingSeconds).toBeLessThanOrEqual(COOLDOWN_SECONDS);
	});
});
