import type { StoreApi } from 'zustand';
import type { UserProfile } from '@/types/user.types';
import type { AuthSessionTokens } from '@/features/auth/types';

export interface SessionState {
	user: UserProfile | null;
	accessToken: string | null;
	refreshToken: string | null;
	tokenExpiresAt: number | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isRefreshing: boolean;
}

export interface SessionActions {
	startSession: (user: UserProfile, session: AuthSessionTokens) => Promise<void>;
	logout: () => Promise<void>;
	refreshAccessToken: () => Promise<boolean>;
	isTokenExpiringSoon: () => boolean;
	loadFromStorage: () => Promise<void>;
	setAvatarUrl: (avatarUrl: string | null) => Promise<void>;
	setUser: (user: UserProfile) => Promise<void>;
}

export type AuthState = SessionState & SessionActions;

export type SetAuthState = StoreApi<AuthState>['setState'];
export type GetAuthState = StoreApi<AuthState>['getState'];

export const SIGNED_OUT: SessionState = {
	user: null,
	accessToken: null,
	refreshToken: null,
	tokenExpiresAt: null,
	isAuthenticated: false,
	isLoading: false,
	isRefreshing: false,
};
