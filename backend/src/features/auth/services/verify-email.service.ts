import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { AuthResponse } from '@/features/auth/auth.types.js';
import { toSessionBody, toUserProfile } from '@/features/auth/utils/auth.helpers.js';
import * as emailVerification from '@/features/auth/services/email-verification.service.js';
import * as magicLinkSession from '@/features/auth/services/magic-link-session.service.js';

/**
 * Check the emailed code, mark the account verified and sign it in:
 * the user and a new session.
 */
export async function verifyEmail(
	userId: string,
	code: string,
	ip: string
): Promise<Required<Pick<AuthResponse, 'user' | 'session' | 'message'>>> {
	await emailVerification.verifyCode(userId, code, ip);

	const { data: profile, error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.select('*, id')
		.eq('id', userId)
		.single();

	if (profileError || !profile) {
		throw new AppError(404, 'User not found', 'USER_NOT_FOUND');
	}

	const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

	if (authError || !authUser.user) {
		throw new AppError(404, 'Auth user not found', 'AUTH_USER_NOT_FOUND');
	}

	const email = authUser.user.email ?? '';
	const session = await magicLinkSession.createMagicLinkSession(email, 'verify-email');

	logger.info('Email verified successfully', { userId });

	return {
		user: toUserProfile(profile, email),
		session: toSessionBody(session),
		message: 'Email verified successfully',
	};
}
