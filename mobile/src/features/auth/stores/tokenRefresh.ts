import type { UserProfile } from '@/types/user.types';
import type { AuthSessionTokens } from '@/features/auth/types';
import * as authApi from '@/features/auth/services/authApi';
import { ApiError } from '@/shared/services/api';
import { logger } from '@/shared/utils/logger';
import type { GetAuthState, SetAuthState } from './authState';

interface TokenRefreshDeps {
	set: SetAuthState;
	get: GetAuthState;
	applySession: (user: UserProfile, session: AuthSessionTokens) => void;
	persist: () => Promise<void>;
	endSessionLocally: () => Promise<void>;
}

/**
 * The store's `refreshAccessToken`: concurrent callers share the request in
 * flight and get its outcome.
 */
export function createTokenRefresh({
	set,
	get,
	applySession,
	persist,
	endSessionLocally,
}: TokenRefreshDeps): () => Promise<boolean> {
	let inFlight: Promise<boolean> | null = null;

	const refresh = async (refreshToken: string): Promise<boolean> => {
		try {
			const response = await authApi.refreshToken(refreshToken);
			if (!response.session) throw new Error('Token refresh did not return a session');

			applySession(response.user, response.session);
			set({ isRefreshing: false });
			await persist();
			return true;
		} catch (error) {
			logger.error('[AuthStore] Token refresh failed:', {
				error,
				errorMessage: error instanceof Error ? error.message : 'Unknown error',
				errorType: error?.constructor?.name,
			});

			// Only a 401 from the refresh call means the backend refused the
			// refresh token; anything else (network, 5xx, 503, 429) is an outage.
			// Callers waiting on this refresh get the same false, so none
			// retries with the stale token.
			if (error instanceof ApiError && error.status === 401) {
				logger.warn('[AuthStore] Refresh token refused, ending the session locally');
				await endSessionLocally();
				return false;
			}

			set({ isRefreshing: false });
			logger.warn('[AuthStore] Keeping the session after a refresh failure; will retry later');
			return false;
		}
	};

	return async () => {
		if (inFlight) return inFlight;

		const { refreshToken } = get();
		if (!refreshToken) {
			// Locally, not through logout(): its backend call would refresh again.
			logger.warn('[AuthStore] No refresh token available, ending the session locally');
			await endSessionLocally();
			return false;
		}

		set({ isRefreshing: true });
		inFlight = refresh(refreshToken).finally(() => {
			inFlight = null;
		});
		return inFlight;
	};
}
