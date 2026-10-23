import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { OAuthProvider, LinkedProvidersResponse } from '@/features/auth/auth.types.js';
import { providerIdField } from '@/features/auth/utils/auth.helpers.js';

/** The first one is the primary. */
export async function getLinkedProviders(userId: string): Promise<LinkedProvidersResponse> {
	const { data: profile, error } = await supabaseAdmin
		.from('user_profiles')
		.select('has_password, google_id, facebook_id, created_at')
		.eq('id', userId)
		.single();

	if (error || !profile) {
		logger.error('Failed to get user profile for linked providers', { userId, error });
		throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
	}

	const linked = [
		['password', profile.has_password],
		['google', profile.google_id],
		['facebook', profile.facebook_id],
	] as const;
	const connectedAt = profile.created_at ?? new Date().toISOString();
	const providers = linked
		.filter(([, value]) => Boolean(value))
		.map(([type], index) => ({ type, connectedAt, isPrimary: index === 0 }));

	logger.info('Retrieved linked providers for user', {
		userId,
		providerCount: providers.length,
	});

	return { providers };
}

/** Refused (400 LAST_PROVIDER) when it is the last sign-in method. */
export async function unlinkProvider(userId: string, provider: OAuthProvider): Promise<void> {
	const { data: profile, error } = await supabaseAdmin
		.from('user_profiles')
		.select('has_password, google_id, facebook_id')
		.eq('id', userId)
		.single();

	if (error || !profile) {
		logger.error('Failed to get user profile for unlinking provider', { userId, provider, error });
		throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
	}

	const connectedCount = [profile.has_password, profile.google_id, profile.facebook_id].filter(
		Boolean
	).length;

	if (connectedCount <= 1) {
		logger.warn('Attempt to unlink last authentication method', { userId, provider });
		throw new AppError(
			400,
			'Cannot unlink last authentication method. Please add another provider first.',
			'LAST_PROVIDER'
		);
	}

	const currentId = provider === 'google' ? profile.google_id : profile.facebook_id;
	if (!currentId) {
		logger.warn('Attempt to unlink provider that is not linked', { userId, provider });
		throw new AppError(404, `${provider} is not linked to this account`, 'PROVIDER_NOT_LINKED');
	}

	const { error: updateError } = await supabaseAdmin
		.from('user_profiles')
		.update({
			...providerIdField(provider, null),
			updated_at: new Date().toISOString(),
		})
		.eq('id', userId);

	if (updateError) {
		logger.error('Failed to unlink provider', { userId, provider, error: updateError });
		throw new AppError(500, 'Failed to unlink provider', 'UNLINK_FAILED');
	}

	logger.info('Provider unlinked successfully', { userId, provider });
}

export async function isProviderLinked(
	provider: OAuthProvider,
	providerId: string
): Promise<boolean> {
	const { data } = await supabaseAdmin
		.from('user_profiles')
		.select('id')
		.eq(`${provider}_id`, providerId)
		.single();

	return !!data;
}
