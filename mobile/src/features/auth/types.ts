import type { UserProfile } from '@/types/user.types';
import type {
	GoogleButtonSlot,
	GoogleButtonVariant,
	LinkedProvider,
	OAuthProvider,
} from '@/shared/services/linkedAccountsBridge';

export type { LinkedProvider, OAuthProvider };
export type { GoogleButtonSlot, GoogleButtonVariant };

export interface LinkedProvidersResponse {
	providers: LinkedProvider[];
}

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
