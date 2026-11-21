import { createStore } from 'zustand/vanilla';
import { notifySessionEnd } from '@/shared/backend/lib/sessionEnd';
import { registerAuthSession } from '@/shared/backend/lib/authSession';
import { createSessionActions } from '@/features/user/features/auth/shared/sign-in/lib/createSessionActions';
import { SIGNED_OUT } from '@/features/user/features/auth/shared/sign-in/configs/sessionConfig';
import type { AuthState } from '@/features/user/features/auth/shared/sign-in/types/authStateTypes';

export const authStore = createStore<AuthState>((set, get) => ({
	...SIGNED_OUT,
	...createSessionActions(set, get),
}));

authStore.subscribe((state, previous) => {
	if (previous.isAuthenticated && !state.isAuthenticated) notifySessionEnd();
});

registerAuthSession({
	store: authStore,
	isTokenExpiringSoon: () => authStore.getState().isTokenExpiringSoon(),
	refreshAccessToken: () => authStore.getState().refreshAccessToken(),
	logout: () => authStore.getState().logout(),
	setAvatarUrl: url => authStore.getState().setAvatarUrl(url),
	setUser: user => authStore.getState().setUser(user),
});
