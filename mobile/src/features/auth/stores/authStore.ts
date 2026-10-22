import { create } from 'zustand';
import { notifySessionEnd, registerAuthSession } from '@/shared/services/authSession';
import { createSessionActions } from './sessionActions';
import { SIGNED_OUT, type AuthState } from './authState';

/**
 * The session (client state): tokens, user and their lifecycle. Every auth
 * action goes through the backend API; server data such as the linked
 * accounts is read with TanStack Query (features/auth/hooks).
 */
export const useAuthStore = create<AuthState>((set, get) => ({
	...SIGNED_OUT,
	...createSessionActions(set, get),
}));

/**
 * Every end of session (logout, refused refresh) is announced to the shared
 * layer: the socket disconnects and the player empties (#312).
 */
useAuthStore.subscribe((state, previous) => {
	if (previous.isAuthenticated && !state.isAuthenticated) notifySessionEnd();
});

registerAuthSession({
	store: useAuthStore,
	isTokenExpiringSoon: () => useAuthStore.getState().isTokenExpiringSoon(),
	refreshAccessToken: () => useAuthStore.getState().refreshAccessToken(),
});
