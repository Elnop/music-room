import type { Session } from '@supabase/supabase-js';
import { supabaseAdmin, createSignInClient } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';

type Failure = [message: string, code: string];

/** Error message and code of each step, per caller (each kept from its own endpoint). */
const FAILURES = {
	oauth: {
		link: ['Failed to generate session link', 'SESSION_LINK_GENERATION_FAILED'],
		hash: ['Invalid magic link response', 'INVALID_MAGIC_LINK_RESPONSE'],
		verify: ['Failed to create session from magic link', 'SESSION_VERIFICATION_FAILED'],
	},
	'verify-email': {
		link: ['Failed to generate session', 'SESSION_GENERATION_FAILED'],
		hash: ['Invalid session response', 'INVALID_SESSION_RESPONSE'],
		verify: ['Failed to create session', 'SESSION_CREATION_FAILED'],
	},
} satisfies Record<string, Record<'link' | 'hash' | 'verify', Failure>>;

function fail([message, code]: Failure, context: Record<string, unknown>): AppError {
	logger.error('Magic link session failed', { code, ...context });
	return new AppError(500, message, code);
}

/**
 * Open a Supabase session for `email` through the Admin magic link API,
 * without touching the account's password: safe for every kind of account.
 * For OAuth, an unexpected failure is a 500 OAUTH_SESSION_ERROR.
 */
export async function createMagicLinkSession(
	email: string,
	caller: keyof typeof FAILURES
): Promise<Session> {
	if (caller === 'verify-email') return openSession(email, FAILURES[caller]);
	try {
		return await openSession(email, FAILURES.oauth);
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error creating OAuth session', { email, error });
		throw new AppError(500, 'Failed to create OAuth session', 'OAUTH_SESSION_ERROR');
	}
}

async function openSession(
	email: string,
	failures: (typeof FAILURES)[keyof typeof FAILURES]
): Promise<Session> {
	const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
		type: 'magiclink',
		email,
	});
	if (linkError || !linkData) {
		throw fail(failures.link, { email, error: linkError });
	}

	const { hashed_token } = linkData.properties;
	if (!hashed_token) {
		throw fail(failures.hash, { email });
	}

	const { data: verifyData, error: verifyError } = await createSignInClient().auth.verifyOtp({
		token_hash: hashed_token,
		type: 'email',
	});
	if (verifyError || !verifyData.session) {
		throw fail(failures.verify, { email, error: verifyError });
	}

	return verifyData.session;
}
