import { supabaseAdmin } from '@/shared/config/supabase.js';
import { logger } from '@/shared/utils/logger.js';
import * as emailVerification from '@/features/auth/services/email-verification.service.js';

/**
 * Resend a verification code to `claimedEmail` for `userId`. The cooldown is
 * checked and counted first, on every path, and the answer never tells whether
 * a code was sent: a matching email must not be told apart by a 429 that other
 * emails never get (#188).
 */
export async function resendCode(userId: string, claimedEmail: string, ip: string): Promise<void> {
	await emailVerification.consumeResend(userId, ip);

	// The recipient comes from the stored account, never from the request body.
	const recipient = await resolveRecipient(userId, claimedEmail);
	if (!recipient) return;

	const code = await emailVerification.generateAndStore(userId);
	await emailVerification.sendCode(recipient, code);

	logger.info('Verification code resent', { userId });
}

/**
 * Auth email of an unverified account whose address matches `claimedEmail`
 * (case-insensitive), or null when no code may be sent. Fails closed: any
 * lookup error returns null.
 */
async function resolveRecipient(userId: string, claimedEmail: string): Promise<string | null> {
	const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
	if (authError) {
		if (authError.status === 404) {
			logger.info('Resend verification: no such account', { userId });
		} else {
			logger.warn('Resend verification: account lookup failed', { userId, error: authError });
		}
		return null;
	}
	const accountEmail = authUser.user?.email;
	if (!accountEmail) {
		logger.info('Resend verification: account has no email', { userId });
		return null;
	}

	const { data: profile, error: profileError } = await supabaseAdmin
		.from('user_profiles')
		.select('email_verified')
		.eq('id', userId)
		.maybeSingle();
	if (profileError || !profile) {
		logger.warn('Resend verification: profile lookup failed', { userId, error: profileError });
		return null;
	}
	if (profile.email_verified) {
		logger.info('Resend verification: account already verified', { userId });
		return null;
	}

	if (accountEmail.toLowerCase() !== claimedEmail.trim().toLowerCase()) {
		logger.warn('Resend verification: email does not match the account', { userId });
		return null;
	}

	return accountEmail;
}
