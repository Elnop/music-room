import {
	GoogleSignin,
	isCancelledResponse,
	statusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { logger } from '@/shared/utils/logger';
import { googleIosClientId } from '@/features/auth/utils/googleIosClientId';
import { SIGN_IN_CANCELLED } from './signInCancelled';

const NO_ID_TOKEN = 'No ID token received from Google Sign-In. Please try again.';

/** The ID token of a sign-in response, at its root or under `data` (v13+). */
function extractIdToken(response: unknown): string {
	if (typeof response === 'object' && response !== null) {
		const obj = response as Record<string, unknown>;
		if (typeof obj.idToken === 'string' && obj.idToken.length > 0) return obj.idToken;
		const data = obj.data as Record<string, unknown> | null | undefined;
		if (typeof data?.idToken === 'string' && data.idToken.length > 0) return data.idToken;
	}
	throw new Error(NO_ID_TOKEN);
}

const WEB_CLIENT_ID =
	Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
	process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

if (!WEB_CLIENT_ID) {
	logger.warn('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not defined. Google login will not work.');
}

// iOS refuses to configure Google Sign-In without its own client ID and throws at app start.
const IOS_CLIENT_ID =
	Platform.OS === 'ios'
		? googleIosClientId(Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME)
		: undefined;

/** Called once at app start; the web client ID gives an ID token on Android and iOS alike. */
export function configureGoogleSignIn(): void {
	GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, iosClientId: IOS_CLIENT_ID, offlineAccess: false });
}

/** Rejects with Error(SIGN_IN_CANCELLED) when the user cancels. */
export async function signInWithGoogle(): Promise<string> {
	if (!WEB_CLIENT_ID) {
		throw new Error(
			'Google Sign-In is not configured. Please set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env file.'
		);
	}

	try {
		await GoogleSignin.hasPlayServices();
		const userInfo = await GoogleSignin.signIn();
		// v13+: a cancel resolves { type: 'cancelled' } instead of throwing
		if (isCancelledResponse(userInfo)) throw new Error(SIGN_IN_CANCELLED);
		return extractIdToken(userInfo);
	} catch (error: unknown) {
		const googleError = error as { code?: string; message?: string };

		if (
			googleError.code === statusCodes.SIGN_IN_CANCELLED ||
			googleError.message === SIGN_IN_CANCELLED
		) {
			throw new Error(SIGN_IN_CANCELLED);
		}
		if (googleError.code === statusCodes.IN_PROGRESS) {
			throw new Error('Sign-in already in progress');
		}
		if (googleError.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
			throw new Error('Google Play Services not available');
		}
		logger.error('[OAuth] Google Sign-In failed:', {
			errorCode: googleError.code,
			errorMessage: googleError.message,
			...(__DEV__ ? { errorType: error?.constructor?.name, fullError: error } : {}),
		});
		throw error;
	}
}
