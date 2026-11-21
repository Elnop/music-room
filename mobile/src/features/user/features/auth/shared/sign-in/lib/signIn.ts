import { ApiError } from '@/shared/backend/lib/api';
import { logger } from '@/shared/logging/logger';
import { authStore } from '@/features/user/features/auth/shared/sign-in/authStore';
import type {
	LoginInput,
	RegisterInput,
} from '@/features/user/features/auth/shared/sign-in/types/authInputTypes';
import type {
	AuthResponse,
	OAuthProvider,
	RegisterResult,
} from '@/features/user/features/auth/authTypes';
import * as authApi from '@/features/user/features/auth/shared/sign-in/lib/authApi';
import * as providerAuthApi from '@/features/user/features/auth/shared/sign-in/lib/providerAuthApi';
import * as emailVerificationApi from '@/features/user/features/auth/shared/sign-in/lib/emailVerificationApi';
import { signInWithGoogle } from '@/features/user/features/auth/shared/sign-in/lib/googleSignIn';
import { signInWithFacebook } from '@/features/user/features/auth/shared/sign-in/lib/facebookSignIn';
import { isSignInCancelled } from '@/features/user/features/auth/shared/sign-in/lib/isSignInCancelled';

async function open(response: AuthResponse): Promise<void> {
	if (!response.session) throw new Error('The backend did not return a session');
	await authStore.getState().startSession(response.user, response.session);
}

export async function login(input: LoginInput): Promise<void> {
	const response = await authApi.login(input);
	if (response.session) await open(response);
}

export async function register(input: RegisterInput): Promise<RegisterResult> {
	const response = await authApi.register(input);
	if (response.requiresVerification) {
		return { requiresVerification: true, userId: response.user.id, email: input.email };
	}
	await open(response);
	return { requiresVerification: false };
}

export async function verifyEmail(userId: string, code: string): Promise<void> {
	await open(await emailVerificationApi.verifyEmail(userId, code));
}

const NATIVE_SIGN_IN = { google: signInWithGoogle, facebook: signInWithFacebook };
const BACKEND_SIGN_IN = {
	google: providerAuthApi.loginWithGoogle,
	facebook: providerAuthApi.loginWithFacebook,
};

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
