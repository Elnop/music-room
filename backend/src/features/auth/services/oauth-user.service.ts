import type { User } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { OAuthProvider, UserProfileRow } from '@/features/auth/auth.types.js';
import { providerIdField, toUserProfile } from '@/features/auth/utils/auth.helpers.js';
import * as magicLinkSession from '@/features/auth/services/magic-link-session.service.js';
import * as oauthSignupService from '@/features/auth/services/oauth-signup.service.js';
import type { OAuthProfile, OAuthUser } from '@/features/auth/services/oauth-signup.service.js';

/** Provider id first, then the same email (linked on the way), else a new account; no email gets a synthetic one. */
export async function createOAuthUser(
	provider: OAuthProvider,
	providerId: string,
	email: string | undefined,
	profile: OAuthProfile
): Promise<OAuthUser> {
	try {
		const effectiveEmail = email || `${provider}_${providerId}@zumik.local`;
		if (!email) {
			logger.info('Using synthetic email for OAuth user', {
				provider,
				providerId,
				syntheticEmail: effectiveEmail,
			});
		}

		const { data: existingOAuth } = await supabaseAdmin
			.from('user_profiles')
			.select('*')
			.eq(`${provider}_id`, providerId)
			.single();
		if (existingOAuth) return await signInLinkedAccount(existingOAuth);

		const existingUser = email ? await findAuthUserByEmail(email) : null;
		if (existingUser) {
			const { data: existingProfile } = await supabaseAdmin
				.from('user_profiles')
				.select('*')
				.eq('id', existingUser.id)
				.single();
			if (existingProfile) {
				return await linkByEmail(existingProfile, provider, providerId, effectiveEmail, profile);
			}
		}

		const created = await oauthSignupService.createOAuthAccount(
			provider,
			providerId,
			email,
			effectiveEmail,
			profile
		);
		// null: the generated username was taken meanwhile, start over.
		return created ?? (await createOAuthUser(provider, providerId, email, profile));
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error during OAuth user creation', { error });
		throw new AppError(500, 'Failed to create OAuth user', 'OAUTH_USER_CREATION_ERROR');
	}
}

/** The provider may be linked under another email: open the session for the account's own auth email. */
async function signInLinkedAccount(account: UserProfileRow): Promise<OAuthUser> {
	if (!account.email_verified) {
		await supabaseAdmin.from('user_profiles').update({ email_verified: true }).eq('id', account.id);
	}

	const { data: authUser, error } = await supabaseAdmin.auth.admin.getUserById(account.id);
	const accountEmail = authUser?.user?.email;
	if (error || !accountEmail) {
		logger.error('Failed to get auth user for OAuth login', { userId: account.id, error });
		throw new AppError(500, 'Failed to load OAuth user', 'OAUTH_USER_LOOKUP_FAILED');
	}

	const session = await magicLinkSession.createMagicLinkSession(accountEmail, 'oauth');
	return { userProfile: toUserProfile(account, accountEmail), session };
}

/** Link the provider to the account holding the same email, unless one is already linked. */
async function linkByEmail(
	account: UserProfileRow,
	provider: OAuthProvider,
	providerId: string,
	email: string,
	profile: OAuthProfile
): Promise<OAuthUser> {
	const linkedId = provider === 'google' ? account.google_id : account.facebook_id;
	if (!linkedId) {
		const avatarUrl = oauthSignupService.avatarOf(profile) ?? account.avatar_url;
		const { error } = await supabaseAdmin
			.from('user_profiles')
			.update({
				...providerIdField(provider, providerId),
				avatar_url: avatarUrl || account.avatar_url || null,
				email_verified: true,
				updated_at: new Date().toISOString(),
			})
			.eq('id', account.id);
		if (error) {
			logger.error('Failed to update profile with OAuth provider', { error });
		}
	}

	const session = await magicLinkSession.createMagicLinkSession(email, 'oauth');
	return { userProfile: toUserProfile(account, email), session };
}

/** Auth user with exactly this email, paging through every user. */
async function findAuthUserByEmail(email: string): Promise<User | null> {
	const perPage = 100;
	for (let page = 1; ; page += 1) {
		const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
		if (error) {
			logger.error('Failed to list users from Supabase auth', { error });
			return null;
		}
		const users = data?.users ?? [];
		if (users.length === 0) return null;
		const match = users.find(u => u.email === email);
		if (match) return match;
	}
}
