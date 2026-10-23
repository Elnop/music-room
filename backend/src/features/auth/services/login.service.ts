import { supabaseAdmin, createSignInClient } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { formatAuthResponse } from '@/features/auth/utils/auth.helpers.js';
import { findAuthUserIdByEmail } from '@/features/auth/utils/find-auth-user.js';
import type { AuthResponse } from '@/features/auth/auth.types.js';
import type { LoginInput } from '@/features/auth/auth.validators.js';

/** 403 EMAIL_NOT_VERIFIED for an account still waiting for its emailed code (OAuth-linked ones excepted). */
export async function login(data: LoginInput): Promise<AuthResponse> {
	try {
		logger.info('User login attempt', { email: data.email });

		const { data: authData, error: authError } = await createSignInClient().auth.signInWithPassword(
			{
				email: data.email,
				password: data.password,
			}
		);

		// Supabase checks the password first and answers email_not_confirmed only to the right one,
		// so this 403 reveals nothing about which emails have an account.
		if (authError?.code === 'email_not_confirmed') {
			const userId = await findAuthUserIdByEmail(data.email);
			logger.warn('Login blocked - email not verified', { userId, email: data.email });
			throw new AppError(
				403,
				'Please verify your email before logging in. Check your inbox for the verification code.',
				'EMAIL_NOT_VERIFIED',
				{ userId, email: data.email }
			);
		}

		if (authError) {
			logger.warn('Login failed - auth error', {
				email: data.email,
				error: authError.message,
			});
			throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
		}

		if (!authData.user || !authData.session) {
			logger.error('Login failed - no user or session returned');
			throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
		}

		const { data: profile, error: profileError } = await supabaseAdmin
			.from('user_profiles')
			.select('*, email_verified, google_id, facebook_id')
			.eq('id', authData.user.id)
			.single();

		if (profileError || !profile) {
			logger.error('Failed to fetch user profile', {
				userId: authData.user.id,
				error: profileError,
			});
			throw new AppError(404, 'User profile not found', 'PROFILE_NOT_FOUND');
		}

		const isOAuthAccount = profile.google_id || profile.facebook_id;
		if (!isOAuthAccount && !profile.email_verified) {
			logger.warn('Login blocked - email not verified', {
				userId: authData.user.id,
				email: authData.user.email,
			});
			throw new AppError(
				403,
				'Please verify your email before logging in. Check your inbox for the verification code.',
				'EMAIL_NOT_VERIFIED',
				{
					userId: authData.user.id,
					email: authData.user.email,
				}
			);
		}

		logger.info('User logged in successfully', {
			userId: authData.user.id,
			username: profile.username,
		});

		return formatAuthResponse(
			authData.user,
			authData.session,
			profile.username,
			profile.display_name ?? undefined,
			profile.avatar_url ?? undefined,
			profile.bio ?? undefined,
			profile.created_at ?? undefined,
			profile.updated_at ?? undefined
		);
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error during login', {
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw new AppError(500, 'Login failed', 'LOGIN_ERROR');
	}
}
