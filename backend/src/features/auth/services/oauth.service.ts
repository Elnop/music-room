import { OAuth2Client } from 'google-auth-library';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { GoogleTokenPayload, FacebookTokenPayload } from '@/features/auth/auth.types.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

if (!GOOGLE_CLIENT_ID) {
	throw new Error('GOOGLE_CLIENT_ID environment variable is not set');
}

if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
	throw new Error('FACEBOOK_APP_ID and FACEBOOK_APP_SECRET environment variables must be set');
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/** Verify a Google Sign-In ID token; 400 when Google has not verified the email. */
export async function verifyGoogleToken(idToken: string): Promise<GoogleTokenPayload> {
	try {
		const ticket = await googleClient.verifyIdToken({
			idToken,
			audience: GOOGLE_CLIENT_ID,
		});

		const payload = ticket.getPayload();

		if (!payload) {
			throw new AppError(401, 'Invalid Google token', 'INVALID_TOKEN');
		}

		if (!payload.email_verified) {
			logger.warn('Google login attempted with unverified email', {
				email: payload.email,
			});
			throw new AppError(400, 'Email not verified with Google', 'EMAIL_NOT_VERIFIED');
		}

		logger.info('Google token verified successfully', {
			sub: payload.sub,
			email: payload.email,
			email_verified: payload.email_verified,
		});

		return {
			sub: payload.sub ?? '',
			email: payload.email ?? '',
			email_verified: payload.email_verified ?? false,
			name: payload.name,
			picture: payload.picture,
			given_name: payload.given_name,
			family_name: payload.family_name,
		};
	} catch (error) {
		if (error instanceof AppError) {
			throw error;
		}

		logger.error('Google token verification failed', { error });
		throw new AppError(401, 'Invalid or expired Google token', 'INVALID_TOKEN');
	}
}

/** Verify a Facebook Login access token for this app and read the profile (email optional). */
export async function verifyFacebookToken(accessToken: string): Promise<FacebookTokenPayload> {
	try {
		const debugUrl = `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;

		const debugResponse = await fetch(debugUrl);
		const debugData = (await debugResponse.json()) as {
			data?: { is_valid?: boolean; app_id?: string; user_id?: string; error?: string };
			error?: string;
		};

		if (!debugResponse.ok || debugData.data?.error) {
			logger.warn('Facebook token verification failed', {
				error: debugData.data?.error || debugData.error,
			});
			throw new AppError(401, 'Invalid Facebook token', 'INVALID_FACEBOOK_TOKEN');
		}

		if (!debugData.data?.is_valid) {
			logger.warn('Facebook token is not valid or expired');
			throw new AppError(401, 'Invalid or expired Facebook token', 'INVALID_TOKEN');
		}

		if (debugData.data.app_id !== FACEBOOK_APP_ID) {
			logger.warn('Facebook token app_id mismatch', {
				expected: FACEBOOK_APP_ID,
				received: debugData.data.app_id,
			});
			throw new AppError(401, 'Token was not issued for this app', 'INVALID_TOKEN');
		}

		const userId = debugData.data.user_id;
		if (!userId) {
			throw new AppError(401, 'Facebook token missing user_id', 'INVALID_TOKEN');
		}

		const profileUrl = `https://graph.facebook.com/v21.0/${userId}?fields=id,name,email,picture.type(large)&access_token=${accessToken}`;

		const profileResponse = await fetch(profileUrl);
		const profileData = (await profileResponse.json()) as {
			id: string;
			name: string;
			email?: string;
			picture?: { data?: { url?: string } };
			error?: { message: string; type: string; code: number };
		};

		if (!profileResponse.ok || profileData.error) {
			logger.error('Facebook profile fetch failed', {
				error: profileData.error,
			});
			throw new AppError(401, 'Failed to fetch Facebook profile', 'PROFILE_FETCH_ERROR');
		}

		// Without the email permission, the account gets a synthetic email.
		logger.info('Facebook token verified successfully', {
			userId: profileData.id,
			email: profileData.email || 'not_provided',
			name: profileData.name,
		});

		return {
			id: profileData.id,
			email: profileData.email, // May be undefined
			name: profileData.name,
			picture: profileData.picture?.data?.url,
		};
	} catch (error) {
		if (error instanceof AppError) {
			throw error;
		}

		logger.error('Facebook token verification failed', { error });
		throw new AppError(401, 'Invalid or expired Facebook token', 'INVALID_TOKEN');
	}
}
