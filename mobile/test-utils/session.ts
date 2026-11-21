import { createStore } from 'zustand';
import { registerAuthSession } from '@/shared/backend/lib/authSession';
import type { SessionView } from '@/shared/backend/lib/authSession';
import type { UserProfile } from '@/shared/users/user.types';

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
