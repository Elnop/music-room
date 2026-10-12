import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { ProviderService } from '@/features/auth/services/provider.service.js';
import { ProviderLinkService } from '@/features/auth/services/provider-link.service.js';
import { AuthService } from '@/features/auth/auth.service.js';

// Token verification calls Google and Facebook: always mocked (doc/TESTING.md).
const { verifyGoogleToken } = vi.hoisted(() => ({ verifyGoogleToken: vi.fn() }));

vi.mock('@/features/auth/services/oauth.service.js', () => ({
	OAuthService: {
		verifyGoogleToken,
		verifyFacebookToken: vi.fn(),
	},
}));

const createdUserIds: string[] = [];

async function createUser(googleId?: string): Promise<{ id: string; email: string }> {
	const email = `int-${randomUUID()}@example.com`;
	const { data, error } = await supabaseAdmin.auth.admin.createUser({
		email,
		password: 'integration-test-password',
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

function googleAccount(sub: string, email = `google-${randomUUID()}@example.com`) {
	verifyGoogleToken.mockResolvedValue({
		sub,
		email,
		email_verified: true,
		name: 'Google User',
	});
	return email;
}

async function googleIdOf(userId: string): Promise<string | null> {
	const { data, error } = await supabaseAdmin
		.from('user_profiles')
		.select('google_id')
		.eq('id', userId)
		.single();
	if (error) throw error;
	return data.google_id;
}

describe('ProviderLinkService.linkProvider (local Supabase stack)', () => {
	beforeEach(() => {
		verifyGoogleToken.mockReset();
		vi.restoreAllMocks();
	});

	afterAll(async () => {
		// Cascades to user_profiles.
		for (const id of createdUserIds) await supabaseAdmin.auth.admin.deleteUser(id);
	});

	it('links a Google account with another email, then Google login opens that same account', async () => {
		const user = await createUser();
		const sub = `g-${randomUUID()}`;
		const googleEmail = googleAccount(sub);
		expect(googleEmail).not.toBe(user.email);

		const result = await ProviderLinkService.linkProvider(user.id, 'google', 'google-token');

		expect(result.providers.map(p => p.type)).toEqual(['password', 'google']);
		expect(await googleIdOf(user.id)).toBe(sub);

		const login = await new AuthService().loginWithGoogle('google-token');

		expect(login.user.id).toBe(user.id);
		expect(login.user.email).toBe(user.email);
		expect(login.session?.accessToken).toEqual(expect.any(String));
	});

	it('refuses a Google account already linked to another user', async () => {
		const sub = `g-${randomUUID()}`;
		await createUser(sub);
		const user = await createUser();
		googleAccount(sub);

		await expect(
			ProviderLinkService.linkProvider(user.id, 'google', 'google-token')
		).rejects.toMatchObject({ statusCode: 409, code: 'PROVIDER_ALREADY_LINKED' });
		expect(await googleIdOf(user.id)).toBeNull();
	});

	it('refuses when the user already has a Google account linked', async () => {
		const existing = `g-${randomUUID()}`;
		const user = await createUser(existing);
		googleAccount(`g-${randomUUID()}`);

		await expect(
			ProviderLinkService.linkProvider(user.id, 'google', 'google-token')
		).rejects.toMatchObject({ statusCode: 409, code: 'PROVIDER_ALREADY_SET' });
		expect(await googleIdOf(user.id)).toBe(existing);
	});

	it('answers 400 INVALID_PROVIDER_TOKEN when the provider rejects the token', async () => {
		const user = await createUser();
		verifyGoogleToken.mockRejectedValue(
			new AppError(401, 'Invalid or expired Google token', 'INVALID_TOKEN')
		);

		await expect(
			ProviderLinkService.linkProvider(user.id, 'google', 'bad-token')
		).rejects.toMatchObject({ statusCode: 400, code: 'INVALID_PROVIDER_TOKEN' });
		expect(await googleIdOf(user.id)).toBeNull();
	});

	it('answers 409 PROVIDER_ALREADY_LINKED when the unique index catches a concurrent link', async () => {
		const sub = `g-${randomUUID()}`;
		await createUser(sub);
		const user = await createUser();
		googleAccount(sub);
		// Simulate the race: the pre-check saw the id as free.
		vi.spyOn(ProviderService, 'isProviderLinked').mockResolvedValue(false);

		await expect(
			ProviderLinkService.linkProvider(user.id, 'google', 'google-token')
		).rejects.toMatchObject({ statusCode: 409, code: 'PROVIDER_ALREADY_LINKED' });
		expect(await googleIdOf(user.id)).toBeNull();
	});

	it('still opens the account by email when it holds another Google id', async () => {
		const otherSub = `g-${randomUUID()}`;
		const user = await createUser(otherSub);
		googleAccount(`g-${randomUUID()}`, user.email);

		const login = await new AuthService().loginWithGoogle('google-token');

		expect(login.user.id).toBe(user.id);
		expect(login.user.email).toBe(user.email);
		expect(await googleIdOf(user.id)).toBe(otherSub);
	});

	it('links only one of two Google accounts linked at once by the same user', async () => {
		const user = await createUser();
		verifyGoogleToken.mockImplementation((token: string) =>
			Promise.resolve({
				sub: `${token}-${user.id}`,
				email: `${token}@example.com`,
				email_verified: true,
			})
		);

		const results = await Promise.allSettled([
			ProviderLinkService.linkProvider(user.id, 'google', 'first'),
			ProviderLinkService.linkProvider(user.id, 'google', 'second'),
		]);

		expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
		const rejected = results.filter(r => r.status === 'rejected');
		expect(rejected).toHaveLength(1);
		expect(rejected[0].reason).toMatchObject({ statusCode: 409, code: 'PROVIDER_ALREADY_SET' });
	});
});
