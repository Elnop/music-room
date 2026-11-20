import type { UserProfile } from '@/shared/users/user.types';
import type { RefCallback } from 'react';
import type { View } from 'react-native';

// Mirrors the backend response types (backend/src/features/auth/auth.types.ts).
export type OAuthProvider = 'google' | 'facebook';

export interface LinkedProvider {
	type: 'password' | OAuthProvider;
	connectedAt: string;
	isPrimary: boolean;
}

export type GoogleButtonVariant = 'form' | 'row';

/** Set on the web only. */
export type GoogleButtonSlot = RefCallback<View>;

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

export type RegisterResult =
	{ requiresVerification: true; userId: string; email: string } | { requiresVerification: false };

export type AuthStackParamList = {
	Welcome: undefined;
	Login: undefined;
	Register: undefined;
	EmailVerification: { userId: string; email: string };
	ForgotPassword: { email?: string } | undefined;
	ResetPassword: { email: string };
	PrivacyPolicy: undefined;
};
