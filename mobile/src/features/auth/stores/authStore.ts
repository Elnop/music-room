import { create } from 'zustand';
import { notifySessionEnd, registerAuthSession } from '@/shared/services/authSession';
import { createSessionActions } from './sessionActions';
import { SIGNED_OUT, type AuthState } from './authState';

/** Client state only: server data such as linked accounts is read with TanStack Query. */
export const useAuthStore = create<AuthState>((set, get) => ({
	...SIGNED_OUT,
	...createSessionActions(set, get),
}));

/** Every end of session is announced to the shared layer: the socket disconnects and the player empties. */
useAuthStore.subscribe((state, previous) => {
	if (previous.isAuthenticated && !state.isAuthenticated) notifySessionEnd();
});

registerAuthSession({
	store: useAuthStore,
	isTokenExpiringSoon: () => useAuthStore.getState().isTokenExpiringSoon(),
	refreshAccessToken: () => useAuthStore.getState().refreshAccessToken(),
	logout: () => useAuthStore.getState().logout(),
	setAvatarUrl: url => useAuthStore.getState().setAvatarUrl(url),
	setUser: user => useAuthStore.getState().setUser(user),
});
