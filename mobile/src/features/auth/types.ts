import type { UserProfile } from '@/types/user.types';
import type { LinkedProvider, OAuthProvider } from '@/shared/services/linkedAccountsBridge';

// Mirrors the backend response types (backend/src/features/auth/auth.types.ts).
export type { LinkedProvider, OAuthProvider };

export interface LinkedProvidersResponse {
	providers: LinkedProvider[];
}

/** Tokens of a backend session; `expiresAt` is in seconds. */
export interface AuthSessionTokens {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	expiresAt: number;
}

/** The answer of every endpoint that may open a session (AuthResponse). */
export interface AuthResponse {
	user: UserProfile;
	session?: AuthSessionTokens;
	requiresVerification?: boolean;
	message?: string;
}

export interface MessageResponse {
	message: string;
}

export interface ResendStatus {
	canResend: boolean;
	remainingSeconds: number;
}

/** What a registration leads to: the code screen, or a signed-in session. */
export type RegisterResult =
	{ requiresVerification: true; userId: string; email: string } | { requiresVerification: false };

/** Screens of the signed-out stack (navigation/AuthNavigator.tsx). */
export type AuthStackParamList = {
	Welcome: undefined;
	Login: undefined;
	Register: undefined;
	EmailVerification: { userId: string; email: string };
	ForgotPassword: { email?: string } | undefined;
	ResetPassword: { email: string };
};
