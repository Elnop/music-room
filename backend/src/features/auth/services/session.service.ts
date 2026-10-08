import { supabase, createSignInClient } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import type { SupabaseUser, AuthResponse } from '@/features/auth/auth.types.js';
import { formatAuthResponse, fetchUserProfile } from '@/features/auth/utils/auth.helpers.js';
import { tokenRevocationService } from '@/features/auth/services/token-revocation.service.js';
import { logger } from '@/shared/utils/logger.js';

/**
 * Service for session and token management
 */
export class SessionService {
	/**
	 * Verify JWT token and return user.
	 * Tokens revoked by a logout are rejected before Supabase is called.
	 */
	async verifyToken(token: string): Promise<SupabaseUser> {
		try {
			if (await tokenRevocationService.isRevoked(token)) {
				throw new AppError(401, 'Token has been revoked', 'TOKEN_REVOKED');
			}

			const {
				data: { user },
				error,
			} = await supabase.auth.getUser(token);

			if (error || !user) {
				throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');
			}

			return {
				id: user.id,
				email: user.email ?? '',
				role: user.role,
			};
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError(401, 'Invalid token', 'INVALID_TOKEN');
		}
	}

	/**
	 * Refresh access token using refresh token
	 */
	async refreshToken(refreshToken: string): Promise<AuthResponse> {
		try {
			const { data, error } = await createSignInClient().auth.refreshSession({
				refresh_token: refreshToken,
			});

			if (error || !data.session || !data.user) {
				throw new AppError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
			}

			const profile = await fetchUserProfile(data.user.id);

			return formatAuthResponse(
				data.user,
				data.session,
				profile.username,
				profile.display_name,
				profile.avatar_url,
				profile.bio,
				profile.created_at,
				profile.updated_at
			);
		} catch (error) {
			if (error instanceof AppError) throw error;
			throw new AppError(401, 'Token refresh failed', 'REFRESH_ERROR');
		}
	}

	/**
	 * End the session the access token belongs to: denylist the token until it
	 * expires, then revoke the Supabase session (scope 'local': only this
	 * session, so its refresh token can no longer mint tokens; other devices
	 * stay signed in). The denylist entry is written even if Supabase fails.
	 */
	async logout(token: string, userId: string): Promise<void> {
		await tokenRevocationService.revoke(token);

		let failure: string | undefined;
		try {
			const { error } = await supabase.auth.admin.signOut(token, 'local');
			if (error) failure = error.message;
		} catch (error) {
			failure = error instanceof Error ? error.message : 'Unknown error';
		}

		if (failure !== undefined) {
			logger.error('Supabase session revocation failed on logout', { userId, error: failure });
			throw new AppError(
				500,
				'Access token revoked, but the session could not be ended: the refresh token may still work',
				'LOGOUT_FAILED'
			);
		}
	}
}
