import { create } from 'zustand';
import { notifySessionEnd, registerAuthSession } from '@/shared/services/authSession';
import { createSessionActions } from './sessionActions';
import { SIGNED_OUT, type AuthState } from './authState';

export const useAuthStore = create<AuthState>((set, get) => ({
	...SIGNED_OUT,
	...createSessionActions(set, get),
}));

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
