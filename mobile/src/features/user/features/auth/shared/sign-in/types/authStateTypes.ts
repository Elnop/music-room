import type { StoreApi } from 'zustand';
import type { UserProfile } from '@/shared/users/userTypes';
import type { AuthSessionTokens } from '@/features/user/features/auth/authTypes';

export type SessionState = {
	user: UserProfile | null;
	accessToken: string | null;
	refreshToken: string | null;
	tokenExpiresAt: number | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isRefreshing: boolean;
};

export type SessionActions = {
	startSession: (user: UserProfile, session: AuthSessionTokens) => Promise<void>;
	logout: () => Promise<void>;
	refreshAccessToken: () => Promise<boolean>;
	isTokenExpiringSoon: () => boolean;
	loadFromStorage: () => Promise<void>;
	setAvatarUrl: (avatarUrl: string | null) => Promise<void>;
	setUser: (user: UserProfile) => Promise<void>;
};

export type AuthState = SessionState & SessionActions;

export type SetAuthState = StoreApi<AuthState>['setState'];
export type GetAuthState = StoreApi<AuthState>['getState'];

export type SessionWriter = {
	applySession: (user: UserProfile, session: AuthSessionTokens) => void;
	persist: () => Promise<void>;
	endSessionLocally: () => Promise<void>;
};

export type SessionAccess = {
	set: SetAuthState;
	get: GetAuthState;
	writer: SessionWriter;
};
