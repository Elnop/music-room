import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { verificationConfig } from '@/features/mail/mail.config.js';
import * as emailVerification from '@/features/auth/services/email-verification.service.js';
import * as loginService from '@/features/auth/services/login.service.js';
import { findAuthUserIdByEmail } from '@/features/auth/utils/find-auth-user.js';
import type { AuthResponse } from '@/features/auth/auth.types.js';
import type { RegisterInput } from '@/features/auth/auth.validators.js';

/** If the verification email cannot be sent, the account is removed and the call fails with 503. */
export async function register(data: RegisterInput): Promise<AuthResponse> {
	try {
		logger.info('Registering new user', {
			email: data.email,
			username: data.username,
		});

		const existingUserId = await findAuthUserIdByEmail(data.email);

		if (existingUserId) {
			const { data: profile } = await supabaseAdmin
				.from('user_profiles')
				.select('email_verified')
				.eq('id', existingUserId)
				.single();

			if (profile && !profile.email_verified) {
				logger.info('Found unverified account with same email, deleting old account', {
					email: data.email,
					oldUserId: existingUserId,
				});

				await supabaseAdmin.from('user_profiles').delete().eq('id', existingUserId);

				await supabaseAdmin.auth.admin.deleteUser(existingUserId);

				logger.info('Old unverified account deleted successfully', {
					email: data.email,
				});
			} else {
				throw new AppError(409, 'Email already registered', 'EMAIL_ALREADY_EXISTS');
			}
		}

		const { data: existingProfile } = await supabaseAdmin
			.from('user_profiles')
			.select('username')
			.eq('username', data.username)
			.single();

		if (existingProfile) {
			throw new AppError(409, 'Username already taken', 'USERNAME_TAKEN');
		}

		const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
			email: data.email,
			password: data.password,
			email_confirm: !verificationConfig.enabled,
		});

		if (authError) {
			logger.error('Supabase auth signup error', { error: authError });
			throw new AppError(400, authError.message, 'AUTH_ERROR');
		}

		if (!authData.user) {
			throw new AppError(400, 'Failed to create user - no user returned', 'AUTH_ERROR');
		}

		const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
			id: authData.user.id,
			username: data.username,
			display_name: data.displayName,
			email_verified: !verificationConfig.enabled,
		});

		if (profileError) {
			logger.error('Failed to create user profile', { error: profileError });
			await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
			throw new AppError(500, 'Failed to create user profile', 'PROFILE_ERROR');
		}

		if (!verificationConfig.enabled) {
			logger.info('User registered without email verification', { userId: authData.user.id });
			const session = await loginService.login({ email: data.email, password: data.password });
			return { ...session, requiresVerification: false };
		}

		await sendCodeOrRollback(authData.user.id, data.email);

		logger.info('User registered successfully, verification email sent', {
			userId: authData.user.id,
			email: data.email,
		});

		return {
			user: {
				id: authData.user.id,
				email: data.email,
				username: data.username,
				displayName: data.displayName,
				avatarUrl: undefined,
				bio: undefined,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
			requiresVerification: true,
			message: 'Registration successful. Please check your email for verification code.',
		};
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error during registration', { error });
		throw new AppError(500, 'Registration failed', 'REGISTRATION_ERROR');
	}
}

/** On failure, removes the new account so no half-created one is left. */
async function sendCodeOrRollback(userId: string, email: string): Promise<void> {
	try {
		const code = await emailVerification.generateAndStore(userId);
		await emailVerification.sendCode(email, code);
	} catch (error) {
		logger.error('Verification email failed, removing the new account', { userId, error });
		await supabaseAdmin.from('user_profiles').delete().eq('id', userId);
		await supabaseAdmin.auth.admin.deleteUser(userId);
		throw new AppError(
			503,
			'Could not send the verification email, please try again later',
			'EMAIL_UNAVAILABLE'
		);
	}
}
