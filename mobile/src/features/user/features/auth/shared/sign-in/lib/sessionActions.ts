import type { UserProfile } from '@/shared/users/user.types';
import type { AuthSessionTokens } from '@/features/user/features/auth/types';
import * as authApi from '@/features/user/features/auth/shared/sign-in/lib/authApi';
import { storedSession } from '@/features/user/features/auth/shared/sign-in/lib/sessionStorage';
import { lastTrackStorage } from '@/shared/playback/lib/lastTrackStorage';
import { logger } from '@/shared/logging/logger';
import { createTokenRefresh } from '@/features/user/features/auth/shared/sign-in/lib/tokenRefresh';
import { SIGNED_OUT } from '@/features/user/features/auth/shared/sign-in/lib/authState';
import type {
	GetAuthState,
	SessionActions,
	SetAuthState,
} from '@/features/user/features/auth/shared/sign-in/lib/authState';

const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

export function createSessionActions(set: SetAuthState, get: GetAuthState): SessionActions {
	async function persist(): Promise<void> {
		const { user, accessToken, refreshToken, tokenExpiresAt, isAuthenticated } = get();
		if (user && accessToken && isAuthenticated) {
			await storedSession.save({ user, accessToken, refreshToken, tokenExpiresAt });
		}
	}

	function applySession(user: UserProfile, session: AuthSessionTokens): void {
		set({
			user,
			accessToken: session.accessToken,
			refreshToken: session.refreshToken,
			tokenExpiresAt: session.expiresAt * 1000,
			isAuthenticated: true,
		});
	}

	async function endSessionLocally(): Promise<void> {
		set(SIGNED_OUT);
		await storedSession.clear();
	}

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
			if (user) {
				await lastTrackStorage
					.clear(user.id)
					.catch(error => logger.warn('[lastTrackStorage] Clear failed', error));
			}
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
