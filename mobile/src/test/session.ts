import { createStore } from 'zustand';
import { registerAuthSession, type SessionView } from '@/shared/services/authSession';
import type { UserProfile } from '@/types/user.types';

export function signIn(userId: string): void {
	registerAuthSession({
		store: createStore<SessionView>(() => ({
			user: { id: userId, username: userId } as UserProfile,
			accessToken: 'access',
			isAuthenticated: true,
		})),
		isTokenExpiringSoon: () => false,
		refreshAccessToken: () => Promise.resolve(true),
	});
}
