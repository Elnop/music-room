import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { OAuthProvider, LinkedProvidersResponse } from '@/features/auth/auth.types.js';
import { providerIdField } from '@/features/auth/utils/auth.helpers.js';
import * as oauth from '@/features/auth/services/oauth.service.js';
import * as providers from '@/features/auth/services/provider.service.js';

const PROVIDER_LABEL: Record<OAuthProvider, string> = {
	google: 'Google',
	facebook: 'Facebook',
};

// Links a Google or Facebook account to a signed-in user, whatever the
// email of the social account (CAP-6).

/**
 * Verify the provider token and return the provider's user id.
 * A rejected token is a 400, not a 401, so the client does not take it
 * for an expired session.
 */
async function verifyProviderId(provider: OAuthProvider, token: string): Promise<string> {
	try {
		const providerId =
			provider === 'google'
				? (await oauth.verifyGoogleToken(token)).sub
				: (await oauth.verifyFacebookToken(token)).id;

		if (!providerId) {
			throw new AppError(401, 'Provider token has no user id', 'INVALID_TOKEN');
		}
		return providerId;
	} catch (error) {
		if (error instanceof AppError && error.statusCode !== 401) {
			throw error;
		}
		logger.warn('Provider token rejected while linking', { provider });
		throw new AppError(
			400,
			`Invalid or expired ${PROVIDER_LABEL[provider]} token`,
			'INVALID_PROVIDER_TOKEN'
		);
	}
}

function alreadyLinked(provider: OAuthProvider): AppError {
	return new AppError(
		409,
		`This ${PROVIDER_LABEL[provider]} account is already linked to another user`,
		'PROVIDER_ALREADY_LINKED'
	);
}

function alreadySet(provider: OAuthProvider): AppError {
	return new AppError(
		409,
		`A ${PROVIDER_LABEL[provider]} account is already linked to this user`,
		'PROVIDER_ALREADY_SET'
	);
}

/**
 * Link a provider account to a user
 * @param userId - Signed-in user ID
 * @param provider - 'google' or 'facebook'
 * @param token - Google ID token or Facebook access token
 * @returns Every provider linked to the user afterwards
 */
export async function linkProvider(
	userId: string,
	provider: OAuthProvider,
	token: string
): Promise<LinkedProvidersResponse> {
	const providerId = await verifyProviderId(provider, token);

	const { data: profile, error } = await supabaseAdmin
		.from('user_profiles')
		.select('google_id, facebook_id')
		.eq('id', userId)
		.single();

	if (error || !profile) {
		logger.error('Failed to get user profile for linking provider', { userId, provider, error });
		throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
	}

	const currentId = provider === 'google' ? profile.google_id : profile.facebook_id;
	if (currentId) {
		throw alreadySet(provider);
	}

	if (await providers.isProviderLinked(provider, providerId)) {
		logger.warn('Provider account already linked to another user', { userId, provider });
		throw alreadyLinked(provider);
	}

	const column = provider === 'google' ? 'google_id' : 'facebook_id';

	// Only write while the column is still empty, so a concurrent link of
	// another account by the same user cannot be overwritten.
	const { data: updated, error: updateError } = await supabaseAdmin
		.from('user_profiles')
		.update({
			...providerIdField(provider, providerId),
			updated_at: new Date().toISOString(),
		})
		.eq('id', userId)
		.is(column, null)
		.select('id');

	if (updateError) {
		if (updateError.code === '23505') {
			logger.warn('Provider account linked concurrently by another user', { userId, provider });
			throw alreadyLinked(provider);
		}
		logger.error('Failed to link provider', { userId, provider, error: updateError });
		throw new AppError(500, 'Failed to link provider', 'LINK_FAILED');
	}

	if (!updated?.length) {
		const { data: current } = await supabaseAdmin
			.from('user_profiles')
			.select('google_id, facebook_id')
			.eq('id', userId)
			.single();

		if (current?.[column]) {
			throw alreadySet(provider);
		}
		logger.error('Link update matched no row', { userId, provider });
		throw new AppError(500, 'Failed to link provider', 'LINK_FAILED');
	}

	logger.info('Provider linked successfully', { userId, provider });

	return providers.getLinkedProviders(userId);
}
