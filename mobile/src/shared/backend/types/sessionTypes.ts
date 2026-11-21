import type { StoreApi } from 'zustand';
import type { UserProfile } from '@/shared/users/userTypes';

export type SessionView = {
	user: UserProfile | null;
	accessToken: string | null;
	isAuthenticated: boolean;
};

export type AuthSession = {
	store: StoreApi<SessionView>;
	isTokenExpiringSoon: () => boolean;
	refreshAccessToken: () => Promise<boolean>;
	logout?: () => Promise<void>;
	setAvatarUrl?: (url: string | null) => Promise<void>;
	setUser?: (user: UserProfile) => void | Promise<void>;
};
