import type { UserProfile } from '@/types/user.types';
import type { AuthSessionTokens } from '@/features/auth/types';
import * as authApi from '@/features/auth/services/authApi';
import { storedSession } from '@/features/auth/services/sessionStorage';
import { lastTrackStorage } from '@/shared/services/lastTrackStorage';
import { logger } from '@/shared/utils/logger';
import { createTokenRefresh } from './tokenRefresh';
import { SIGNED_OUT, type GetAuthState, type SessionActions, type SetAuthState } from './authState';

const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

/** The session actions of the auth store, bound to its `set` and `get`. */
export function createSessionActions(set: SetAuthState, get: GetAuthState): SessionActions {
	const persist = async (): Promise<void> => {
		const { user, accessToken, refreshToken, tokenExpiresAt, isAuthenticated } = get();
		if (user && accessToken && isAuthenticated) {
			await storedSession.save({ user, accessToken, refreshToken, tokenExpiresAt });
		}
	};

	const applySession = (user: UserProfile, session: AuthSessionTokens): void => {
		set({
			user,
			accessToken: session.accessToken,
			refreshToken: session.refreshToken,
			tokenExpiresAt: session.expiresAt * 1000,
			isAuthenticated: true,
		});
	};

	/**
	 * Ends the session on the device only, without calling the backend: for a
	 * refused refresh, `authApi.logout` goes through `apiRequest`, whose
	 * proactive refresh would call `refreshAccessToken` again. RootNavigator
	 * shows the auth screens once `isAuthenticated` is false.
	 */
	const endSessionLocally = async (): Promise<void> => {
		set(SIGNED_OUT);
		await storedSession.clear();
	};

	return {
		startSession: async (user, session) => {
			applySession(user, session);
			await persist();
		},

		logout: async () => {
			set({ isLoading: true });
			const { accessToken, user } = get();
			if (accessToken) {
				try {
					await authApi.logout(accessToken);
				} catch (error) {
					logger.warn('Backend logout failed, continuing with local logout', error);
				}
			}
			await endSessionLocally();
			// After the session ends, so the player no longer saves it for this user (#312).
			if (user) await lastTrackStorage.clear(user.id);
		},

		refreshAccessToken: createTokenRefresh({ set, get, applySession, persist, endSessionLocally }),

		isTokenExpiringSoon: () => {
			const { tokenExpiresAt } = get();
			return !tokenExpiresAt || tokenExpiresAt - Date.now() < EXPIRY_MARGIN_MS;
		},

		loadFromStorage: async () => {
			try {
				const stored = await storedSession.load();
				if (stored) set({ ...stored, isAuthenticated: true });
			} catch (error) {
				logger.error('Failed to load auth state from storage:', error);
				await storedSession.clear();
			}
		},

		setAvatarUrl: async avatarUrl => {
			const { user } = get();
			if (!user) return;
			set({ user: { ...user, avatarUrl: avatarUrl ?? undefined } });
			await persist();
		},

		setUser: async user => {
			set({ user });
			await persist();
		},
	};
}
