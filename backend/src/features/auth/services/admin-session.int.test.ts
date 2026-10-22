import { randomUUID } from 'node:crypto';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import * as loginService from '@/features/auth/services/login.service.js';
import * as sessionService from '@/features/auth/services/session.service.js';
import * as oauthLoginService from '@/features/auth/services/oauth-login.service.js';

// Token verification calls Google and Facebook: always mocked (doc/TESTING.md).
const { verifyGoogleToken } = vi.hoisted(() => ({ verifyGoogleToken: vi.fn() }));

vi.mock('@/features/auth/services/oauth.service.js', () => ({
	verifyGoogleToken,
	verifyFacebookToken: vi.fn(),
}));

const PASSWORD = 'integration-test-password';
const createdUserIds: string[] = [];

async function createUser(googleId?: string): Promise<{ id: string; email: string }> {
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
		google_id: googleId ?? null,
	});
	if (profileError) throw profileError;

	return { id, email };
}

/**
 * Writes another user's profile through supabaseAdmin. Under RLS as a signed-in
 * user, user_profiles_update_policy (auth.uid() = id) matches no row and
 * PostgREST answers without error, so the test counts the updated rows.
 */
async function expectAdminWriteOn(userId: string): Promise<void> {
	const bio = `bio-${randomUUID()}`;
	const { data, error } = await supabaseAdmin
		.from('user_profiles')
		.update({ bio })
		.eq('id', userId)
		.select('bio');
	expect(error).toBeNull();
	expect(data).toEqual([{ bio }]);
}

describe('supabaseAdmin after a user sign-in (local Supabase stack)', () => {
	afterAll(async () => {
		// Cascades to user_profiles.
		for (const id of createdUserIds) await supabaseAdmin.auth.admin.deleteUser(id);
	});

	it('keeps writing as service role after a password login and a refresh', async () => {
		const user = await createUser();
		const other = await createUser();

		const login = await loginService.login({ email: user.email, password: PASSWORD });
		expect(login.user.id).toBe(user.id);
		await expectAdminWriteOn(other.id);

		const refreshed = await sessionService.refreshToken(login.session!.refreshToken);
		expect(refreshed.user.id).toBe(user.id);
		await expectAdminWriteOn(other.id);
	});

	it('keeps writing as service role after a Google login', async () => {
		const sub = `g-${randomUUID()}`;
		const user = await createUser(sub);
		const other = await createUser();
		verifyGoogleToken.mockResolvedValue({
			sub,
			email: user.email,
			email_verified: true,
			name: 'Google User',
		});

		const login = await oauthLoginService.loginWithGoogle('google-token');

		expect(login.user.id).toBe(user.id);
		await expectAdminWriteOn(other.id);
	});
});
