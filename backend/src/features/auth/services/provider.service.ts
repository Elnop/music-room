import { supabase } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { OAuthProvider, LinkedProvidersResponse } from '@/features/auth/auth.types.js';

/**
 * Provider Service
 * Manages linked OAuth providers for user accounts
 */
export class ProviderService {
	/**
	 * Get list of linked providers for a user
	 * @param userId - User ID
	 * @returns List of linked providers with metadata
	 */
	static async getLinkedProviders(userId: string): Promise<LinkedProvidersResponse> {
		const { data: profile, error } = await supabase
			.from('user_profiles')
			.select('has_password, google_id, facebook_id, created_at')
			.eq('id', userId)
			.single();

		if (error || !profile) {
			logger.error('Failed to get user profile for linked providers', {
				userId,
				error,
			});
			throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
		}

		const providers: LinkedProvidersResponse['providers'] = [];

		if (profile.has_password) {
			providers.push({
				type: 'password',
				connectedAt: profile.created_at ?? new Date().toISOString(),
				isPrimary: providers.length === 0,
			});
		}

		if (profile.google_id) {
			providers.push({
				type: 'google',
				connectedAt: profile.created_at ?? new Date().toISOString(),
				isPrimary: providers.length === 0,
			});
		}

		if (profile.facebook_id) {
			providers.push({
				type: 'facebook',
				connectedAt: profile.created_at ?? new Date().toISOString(),
				isPrimary: providers.length === 0,
			});
		}

		logger.info('Retrieved linked providers for user', {
			userId,
			providerCount: providers.length,
		});

		return { providers };
	}

	/**
	 * Unlink OAuth provider from user account
	 * Security: Cannot unlink if it's the last authentication method
	 * @param userId - User ID
	 * @param provider - Provider to unlink ('google' or 'facebook')
	 */
	static async unlinkProvider(userId: string, provider: OAuthProvider): Promise<void> {
		const { data: profile, error } = await supabase
			.from('user_profiles')
			.select('has_password, google_id, facebook_id')
			.eq('id', userId)
			.single();

		if (error || !profile) {
			logger.error('Failed to get user profile for unlinking provider', {
				userId,
				provider,
				error,
			});
			throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
		}

		const connectedCount = [profile.has_password, profile.google_id, profile.facebook_id].filter(
			Boolean
		).length;

		if (connectedCount <= 1) {
			logger.warn('Attempt to unlink last authentication method', {
				userId,
				provider,
			});
			throw new AppError(
				400,
				'Cannot unlink last authentication method. Please add another provider first.',
				'LAST_PROVIDER'
			);
		}

		const providerColumn = `${provider}_id`;
		const dbProfile = profile as Record<string, unknown>;
		if (!dbProfile[providerColumn]) {
			logger.warn('Attempt to unlink provider that is not linked', {
				userId,
				provider,
			});
			throw new AppError(404, `${provider} is not linked to this account`, 'PROVIDER_NOT_LINKED');
		}

		const { error: updateError } = await supabase
			.from('user_profiles')
			.update({
				[providerColumn]: null,
				updated_at: new Date().toISOString(),
			})
			.eq('id', userId);

		if (updateError) {
			logger.error('Failed to unlink provider', {
				userId,
				provider,
				error: updateError,
			});
			throw new AppError(500, 'Failed to unlink provider', 'UNLINK_FAILED');
		}

		logger.info('Provider unlinked successfully', {
			userId,
			provider,
		});
	}

	/**
	 * Check if provider ID is already linked to ANY account
	 * @param provider - Provider type ('google' or 'facebook')
	 * @param providerId - Provider-specific user ID
	 * @returns True if already linked, false otherwise
	 */
	static async isProviderLinked(provider: OAuthProvider, providerId: string): Promise<boolean> {
		const providerColumn = `${provider}_id`;

		const { data } = await supabase
			.from('user_profiles')
			.select('id')
			.eq(providerColumn, providerId)
			.single();

		return !!data;
	}
}
