import { ApiError } from '@/shared/services/api';
import { logger } from '@/shared/utils/logger';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { LoginInput, RegisterInput } from '@/features/auth/validators';
import type { AuthResponse, OAuthProvider, RegisterResult } from '@/features/auth/types';
import * as authApi from './authApi';
import { signInWithGoogle } from './googleSignIn';
import { signInWithFacebook } from './facebookSignIn';
import { isSignInCancelled } from './signInCancelled';

/** Opens the session the backend returned; RootNavigator then shows the app. */
async function open(response: AuthResponse): Promise<void> {
	if (!response.session) throw new Error('The backend did not return a session');
	await useAuthStore.getState().startSession(response.user, response.session);
}

export async function login(input: LoginInput): Promise<void> {
	const response = await authApi.login(input);
	// Without a session the user stays on the login screen.
	if (response.session) await open(response);
}

/** Registers; the account either needs its email verified or is signed in. */
export async function register(input: RegisterInput): Promise<RegisterResult> {
	const response = await authApi.register(input);
	if (response.requiresVerification) {
		return { requiresVerification: true, userId: response.user.id, email: input.email };
	}
	await open(response);
	return { requiresVerification: false };
}

export async function verifyEmail(userId: string, code: string): Promise<void> {
	await open(await authApi.verifyEmail(userId, code));
}

const NATIVE_SIGN_IN = { google: signInWithGoogle, facebook: signInWithFacebook };
const BACKEND_SIGN_IN = { google: authApi.loginWithGoogle, facebook: authApi.loginWithFacebook };

/** Native Google or Facebook sign-in, then the backend session for its token. */
export async function signInWithProvider(provider: OAuthProvider): Promise<void> {
	try {
		const token = await NATIVE_SIGN_IN[provider]();
		await open(await BACKEND_SIGN_IN[provider](token));
	} catch (error) {
		if (!isSignInCancelled(error)) {
			logger.error(`[AuthStore] ${provider} sign-in failed:`, {
				errorType: error?.constructor?.name,
				isApiError: error instanceof ApiError,
				errorMessage: error instanceof Error ? error.message : 'Unknown error',
				errorCode: error instanceof ApiError ? error.code : undefined,
				...(__DEV__ && error instanceof ApiError ? { errorDetails: error.details } : {}),
			});
		}
		throw error;
	}
}
