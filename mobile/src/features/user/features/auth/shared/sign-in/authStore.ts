import { create } from 'zustand';
import { notifySessionEnd, registerAuthSession } from '@/shared/backend/lib/authSession';
import { createSessionActions } from '@/features/user/features/auth/shared/sign-in/lib/sessionActions';
import { SIGNED_OUT } from '@/features/user/features/auth/shared/sign-in/lib/authState';
import type { AuthState } from '@/features/user/features/auth/shared/sign-in/lib/authState';

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
