// Browser variant: the Facebook JavaScript SDK, loaded when a screen offers Facebook.
import Constants from 'expo-constants';
import { logger } from '@/shared/utils/logger';
import { loadScript } from '@/features/auth/utils/loadScript';
import { SIGN_IN_CANCELLED } from './signInCancelled';

const SDK_SCRIPT = 'https://connect.facebook.net/en_US/sdk.js';
/** The Graph API version the backend queries. */
const GRAPH_VERSION = 'v21.0';

interface LoginResponse {
	status?: string;
	authResponse?: { accessToken?: string } | null;
}

interface FacebookSdk {
	init: (config: { appId: string; version: string; cookie: boolean; xfbml: boolean }) => void;
	login: (callback: (response: LoginResponse) => void, options: { scope: string }) => void;
}

const FACEBOOK_APP_ID: string | undefined =
	Constants.expoConfig?.extra?.EXPO_PUBLIC_FACEBOOK_APP_ID ||
	process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

let initialized = false;

async function loadSdk(): Promise<FacebookSdk> {
	if (!FACEBOOK_APP_ID) {
		throw new Error(
			'Facebook App ID not configured. Please set EXPO_PUBLIC_FACEBOOK_APP_ID in your .env file.'
		);
	}
	await loadScript(SDK_SCRIPT);
	const sdk = (globalThis as { FB?: FacebookSdk }).FB;
	if (!sdk) throw new Error('The Facebook SDK did not start');
	if (!initialized) {
		sdk.init({ appId: FACEBOOK_APP_ID, version: GRAPH_VERSION, cookie: false, xfbml: false });
		initialized = true;
	}
	return sdk;
}

/** The SDK loads on demand, not at app start. */
export function initializeFacebookSDK(): void {}

/** `FB.login` opens a popup, which the browser blocks unless it follows the click closely. */
export function preloadFacebookSdk(): void {
	loadSdk().catch((error: unknown) => {
		logger.warn('[OAuth] Facebook SDK not loaded:', {
			errorMessage: error instanceof Error ? error.message : String(error),
		});
	});
}

/** Rejects with Error(SIGN_IN_CANCELLED) when the user closes the popup or declines. */
export async function signInWithFacebook(): Promise<string> {
	const sdk = await loadSdk();
	const response = await new Promise<LoginResponse>(resolve =>
		sdk.login(resolve, { scope: 'public_profile,email' })
	);
	const accessToken = response.authResponse?.accessToken;
	if (response.status !== 'connected' || !accessToken) throw new Error(SIGN_IN_CANCELLED);
	return accessToken;
}
