import { OAuth2Client } from 'google-auth-library';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { GoogleTokenPayload, FacebookTokenPayload } from '@/features/auth/auth.types.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;

if (!GOOGLE_CLIENT_ID) {
	throw new Error('GOOGLE_CLIENT_ID environment variable is not set');
}

if (!FACEBOOK_APP_ID) {
	throw new Error('FACEBOOK_APP_ID environment variable is not set');
}

const GRAPH_API = 'https://graph.facebook.com/v21.0';

function graphUrl(path: string, accessToken: string, fields?: string): string {
	const url = new URL(`${GRAPH_API}/${path}`);
	url.searchParams.set('access_token', accessToken);
	if (fields) url.searchParams.set('fields', fields);
	return url.toString();
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/** 400 when Google has not verified the email. */
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

/** Checks the token was issued for this app; the profile email is optional. */
export async function verifyFacebookToken(accessToken: string): Promise<FacebookTokenPayload> {
	try {
		// The user token alone tells which app it was issued for: no app secret needed.
		const appResponse = await fetch(graphUrl('app', accessToken));
		const appData = (await appResponse.json()) as {
			id?: string;
			error?: { message: string; type: string; code: number };
		};

		if (!appResponse.ok || appData.error) {
			logger.warn('Facebook token verification failed', { error: appData.error });
			throw new AppError(401, 'Invalid Facebook token', 'INVALID_FACEBOOK_TOKEN');
		}

		if (appData.id !== FACEBOOK_APP_ID) {
			logger.warn('Facebook token app_id mismatch', {
				expected: FACEBOOK_APP_ID,
				received: appData.id,
			});
			throw new AppError(401, 'Token was not issued for this app', 'INVALID_TOKEN');
		}

		const profileUrl = graphUrl('me', accessToken, 'id,name,email,picture.type(large)');

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
			email: profileData.email,
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
