import type { SessionState } from '@/features/user/features/auth/shared/sign-in/types/authStateTypes';

export const SIGNED_OUT: SessionState = {
	user: null,
	accessToken: null,
	refreshToken: null,
	tokenExpiresAt: null,
	isAuthenticated: false,
	isLoading: false,
	isRefreshing: false,
};
