import type { Session } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { OAuthProvider, UserProfile } from '@/features/auth/auth.types.js';
import { providerIdField, toUserProfile } from '@/features/auth/utils/auth.helpers.js';
import * as usernameService from '@/features/auth/services/username.service.js';
import * as magicLinkSession from '@/features/auth/services/magic-link-session.service.js';

export interface OAuthProfile {
	name: string;
	picture?: string | { data: { url: string } };
}

export interface OAuthUser {
	userProfile: UserProfile;
	session: Session;
}

export function avatarOf(profile: OAuthProfile): string | null {
	return typeof profile.picture === 'string'
		? profile.picture
		: (profile.picture?.data?.url ?? null);
}

/** Null when a concurrent sign-up took the generated username (23505): the auth user is removed, the caller retries. */
export async function createOAuthAccount(
	provider: OAuthProvider,
	providerId: string,
	email: string | undefined,
	effectiveEmail: string,
	profile: OAuthProfile
): Promise<OAuthUser | null> {
	const username = await usernameService.generateUniqueUsername(
		profile.name || effectiveEmail.split('@')[0]
	);

	const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
		email: effectiveEmail,
		email_confirm: true,
		user_metadata: {
			oauth_provider: provider,
			oauth_provider_id: providerId,
			display_name: profile.name,
			avatar_url: profile.picture || null,
			is_synthetic_email: !email,
		},
	});

	if (authError || !authData.user) {
		logger.error('Failed to create OAuth auth user', { error: authError });
		throw new AppError(500, 'Failed to create user', 'USER_CREATION_FAILED');
	}
	const userId = authData.user.id;

	try {
		const { data: userProfile, error: profileError } = await supabaseAdmin
			.from('user_profiles')
			.insert({
				id: userId,
				username,
				display_name: profile.name || username,
				avatar_url: avatarOf(profile),
				...providerIdField(provider, providerId),
				email_verified: true,
				// Signed up with Google or Facebook: no password until one is set.
				has_password: false,
			})
			.select()
			.single();

		if (profileError) {
			await supabaseAdmin.auth.admin.deleteUser(userId);
			if (profileError.code === '23505') return null;

			logger.error('Failed to create user profile', { error: profileError });
			throw new AppError(500, 'Failed to create profile', 'PROFILE_CREATION_FAILED');
		}

		if (!userProfile) {
			throw new AppError(500, 'Profile creation returned no data', 'PROFILE_CREATION_FAILED');
		}

		const session = await magicLinkSession.createMagicLinkSession(effectiveEmail, 'oauth');
		return { userProfile: toUserProfile(userProfile, effectiveEmail), session };
	} catch (error) {
		await supabaseAdmin.auth.admin.deleteUser(userId);
		throw error;
	}
}
