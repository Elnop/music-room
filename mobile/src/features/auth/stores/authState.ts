import type { StoreApi } from 'zustand';
import type { UserProfile } from '@/types/user.types';
import type { AuthSessionTokens } from '@/features/auth/types';

/** Client state (state.md#server-vs-client-state). */
export interface SessionState {
	user: UserProfile | null;
	accessToken: string | null;
	refreshToken: string | null;
	/** Milliseconds since the epoch. */
	tokenExpiresAt: number | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isRefreshing: boolean;
}

export interface SessionActions {
	/** Signs in with a session the backend returned, and persists it. */
	startSession: (user: UserProfile, session: AuthSessionTokens) => Promise<void>;
	/** Revokes the session on the backend, then ends it on the device even if that fails. */
	logout: () => Promise<void>;
	/** Shares one refresh between concurrent callers; false when it failed. */
	refreshAccessToken: () => Promise<boolean>;
	/** True when the access token expires within five minutes, or is unknown. */
	isTokenExpiringSoon: () => boolean;
	/** Restores the session stored on the device, at app start. */
	loadFromStorage: () => Promise<void>;
	/** New avatar URL after an upload, null after a removal. */
	setAvatarUrl: (avatarUrl: string | null) => Promise<void>;
	/** Updates the user profile in state and storage. */
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
