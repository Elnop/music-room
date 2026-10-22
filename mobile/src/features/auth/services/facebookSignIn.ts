import { LoginManager, AccessToken, Settings } from 'react-native-fbsdk-next';
import Constants from 'expo-constants';
import { logger } from '@/shared/utils/logger';
import { SIGN_IN_CANCELLED } from './signInCancelled';

const FACEBOOK_APP_ID =
	Constants.expoConfig?.extra?.EXPO_PUBLIC_FACEBOOK_APP_ID ||
	process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

if (!FACEBOOK_APP_ID) {
	logger.warn('EXPO_PUBLIC_FACEBOOK_APP_ID is not defined. Facebook login will not work.');
}

/** Initializes the Facebook SDK; called once at app start. */
export function initializeFacebookSDK(): void {
	if (FACEBOOK_APP_ID) {
		Settings.setAppID(FACEBOOK_APP_ID);
		Settings.initializeSDK();
	}
}

/**
 * Native Facebook login. Resolves the access token to send to the backend;
 * rejects with Error(SIGN_IN_CANCELLED) when the user cancels.
 */
export async function signInWithFacebook(): Promise<string> {
	try {
		if (!FACEBOOK_APP_ID) {
			throw new Error(
				'Facebook App ID not configured. Please set EXPO_PUBLIC_FACEBOOK_APP_ID in your .env file.'
			);
		}

		const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
		if (result.isCancelled) throw new Error(SIGN_IN_CANCELLED);

		const accessTokenData = await AccessToken.getCurrentAccessToken();
		const accessToken = accessTokenData?.accessToken || null;
		if (!accessToken) {
			throw new Error('No access token received from Facebook Login. Please try again.');
		}
		return accessToken;
	} catch (error: unknown) {
		const fbError = error as { message?: string };
		if (fbError.message === SIGN_IN_CANCELLED) throw new Error(SIGN_IN_CANCELLED);

		logger.error('[OAuth] Facebook Sign-In failed:', {
			errorMessage: fbError.message,
			...(__DEV__ ? { errorType: error?.constructor?.name, fullError: error } : {}),
		});
		throw error;
	}
}
