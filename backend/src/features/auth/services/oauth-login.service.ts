import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { AuthResponse } from '@/features/auth/auth.types.js';
import { toSessionBody } from '@/features/auth/utils/auth.helpers.js';
import * as oauth from '@/features/auth/services/oauth.service.js';
import * as oauthUserService from '@/features/auth/services/oauth-user.service.js';
import type { OAuthUser } from '@/features/auth/services/oauth-signup.service.js';

function toAuthResponse({ userProfile, session }: OAuthUser): AuthResponse {
	return { user: userProfile, session: toSessionBody(session) };
}

/** Sign in with a Google ID token from the mobile app. */
export async function loginWithGoogle(idToken: string): Promise<AuthResponse> {
	try {
		logger.info('Google OAuth login attempt');

		const google = await oauth.verifyGoogleToken(idToken);
		const user = await oauthUserService.createOAuthUser('google', google.sub, google.email, {
			name: google.name || google.email.split('@')[0],
			picture: google.picture,
		});

		logger.info('Google OAuth login successful', {
			userId: user.userProfile.id,
			username: user.userProfile.username,
		});
		return toAuthResponse(user);
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error during Google OAuth login', { error });
		throw new AppError(500, 'Google login failed', 'GOOGLE_LOGIN_ERROR');
	}
}

/** Sign in with a Facebook access token from the mobile app. */
export async function loginWithFacebook(accessToken: string): Promise<AuthResponse> {
	try {
		logger.info('Facebook OAuth login attempt');

		const facebook = await oauth.verifyFacebookToken(accessToken);
		const user = await oauthUserService.createOAuthUser('facebook', facebook.id, facebook.email, {
			name: facebook.name,
			picture: facebook.picture,
		});

		logger.info('Facebook OAuth login successful', {
			userId: user.userProfile.id,
			username: user.userProfile.username,
			hasSyntheticEmail: !facebook.email,
		});
		return toAuthResponse(user);
	} catch (error) {
		if (error instanceof AppError) throw error;
		logger.error('Unexpected error during Facebook OAuth login', { error });
		throw new AppError(500, 'Facebook login failed', 'FACEBOOK_LOGIN_ERROR');
	}
}
