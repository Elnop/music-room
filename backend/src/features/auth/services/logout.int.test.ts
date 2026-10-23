import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { connectRedis, disconnectRedis, isRedisConnected } from '@/shared/config/redis.js';
import * as loginService from '@/features/auth/services/login.service.js';
import * as sessionService from '@/features/auth/services/session.service.js';

// Token verification calls Google and Facebook: always mocked (doc/development/testing.md).
vi.mock('@/features/auth/services/oauth.service.js', () => ({
	verifyGoogleToken: vi.fn(),
	verifyFacebookToken: vi.fn(),
}));

const PASSWORD = 'integration-test-password';
const createdUserIds: string[] = [];

async function createUser(): Promise<{ id: string; email: string }> {
	const email = `int-${randomUUID()}@example.com`;
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

	return { id, email };
}

async function signIn(email: string) {
	const login = await loginService.login({ email, password: PASSWORD });
	const session = login.session;
	if (!session) throw new Error('login returned no session');
	return { accessToken: session.accessToken, refreshToken: session.refreshToken };
}

describe('logout revokes the session (local Supabase stack + Redis)', () => {
	beforeAll(async () => {
		await connectRedis();
		if (!isRedisConnected()) throw new Error('Redis from scripts/test-db.sh is not reachable');
	});

	afterAll(async () => {
		// Cascades to user_profiles.
		for (const id of createdUserIds) await supabaseAdmin.auth.admin.deleteUser(id);
		await disconnectRedis();
	});

	it('rejects the old access token and the old refresh token', async () => {
		const user = await createUser();
		const session = await signIn(user.email);

		await expect(sessionService.verifyToken(session.accessToken)).resolves.toMatchObject({
			id: user.id,
		});

		await sessionService.logout(session.accessToken, user.id);

		await expect(sessionService.verifyToken(session.accessToken)).rejects.toMatchObject({
			statusCode: 401,
			code: 'TOKEN_REVOKED',
		});
		await expect(sessionService.refreshToken(session.refreshToken)).rejects.toMatchObject({
			statusCode: 401,
			code: 'INVALID_REFRESH_TOKEN',
		});
	});

	it("keeps the same user's other session signed in", async () => {
		const user = await createUser();
		const first = await signIn(user.email);
		const second = await signIn(user.email);

		await sessionService.logout(first.accessToken, user.id);

		await expect(sessionService.verifyToken(second.accessToken)).resolves.toMatchObject({
			id: user.id,
		});
		const refreshed = await sessionService.refreshToken(second.refreshToken);
		expect(refreshed.user.id).toBe(user.id);
	});
});
