import { isAuthApiError, isAuthError } from '@supabase/supabase-js';
import { supabaseAdmin, createSignInClient } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import type { SupabaseUser, AuthResponse } from '@/features/auth/auth.types.js';
import { formatAuthResponse, fetchUserProfile } from '@/features/auth/utils/auth.helpers.js';
import * as tokenRevocation from '@/features/auth/services/token-revocation.service.js';
import { logger } from '@/shared/utils/logger.js';

/** Tokens revoked by a logout are rejected before Supabase is called. */
export async function verifyToken(token: string): Promise<SupabaseUser> {
	try {
		if (await tokenRevocation.isRevoked(token)) {
			throw new AppError(401, 'Token has been revoked', 'TOKEN_REVOKED');
		}

		const {
			data: { user },
			error,
		} = await supabaseAdmin.auth.getUser(token);

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

/** 401 only when Supabase Auth refuses the token; an outage is 503 so the client keeps its session. */
export async function refreshToken(refreshToken: string): Promise<AuthResponse> {
	try {
		const { data, error } = await createSignInClient().auth.refreshSession({
			refresh_token: refreshToken,
		});

		if (error) {
			if (isRefusal(error)) {
				throw new AppError(401, 'Invalid or expired refresh token', 'INVALID_REFRESH_TOKEN');
			}
			throw authUnavailable(error);
		}

		if (!data.session || !data.user) {
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
		throw authUnavailable(error);
	}
}

/** Denylist first (even if Supabase then fails), then revoke with scope 'local': other devices stay signed in. */
export async function logout(token: string, userId: string): Promise<void> {
	await tokenRevocation.revoke(token);

	let failure: string | undefined;
	try {
		const { error } = await supabaseAdmin.auth.admin.signOut(token, 'local');
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

/** A 4xx other than 408 (timeout) and 429 (rate limit), which say nothing about the token. */
function isRefusal(error: unknown): boolean {
	return (
		isAuthApiError(error) &&
		error.status >= 400 &&
		error.status < 500 &&
		error.status !== 408 &&
		error.status !== 429
	);
}

/** Supabase Auth unreachable or failing: not a refusal of the refresh token. */
function authUnavailable(error: unknown): AppError {
	logger.warn('Supabase Auth unavailable during token refresh', {
		error: error instanceof Error ? error.message : String(error),
		status: isAuthError(error) ? error.status : undefined,
	});
	return new AppError(503, 'Authentication service is unavailable', 'AUTH_UNAVAILABLE');
}
