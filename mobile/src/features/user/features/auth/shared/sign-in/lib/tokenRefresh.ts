import type { UserProfile } from '@/shared/users/userTypes';
import type { AuthSessionTokens } from '@/features/user/features/auth/types';
import * as authApi from '@/features/user/features/auth/shared/sign-in/lib/authApi';
import { ApiError } from '@/shared/backend/lib/api';
import { logger } from '@/shared/logging/logger';
import type {
	GetAuthState,
	SetAuthState,
} from '@/features/user/features/auth/shared/sign-in/lib/authState';

type TokenRefreshDeps = {
	set: SetAuthState;
	get: GetAuthState;
	applySession: (user: UserProfile, session: AuthSessionTokens) => void;
	persist: () => Promise<void>;
	endSessionLocally: () => Promise<void>;
};

export function createTokenRefresh({
	set,
	get,
	applySession,
	persist,
	endSessionLocally,
}: TokenRefreshDeps): () => Promise<boolean> {
	let inFlight: Promise<boolean> | null = null;

	async function refresh(refreshToken: string): Promise<boolean> {
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

			if (error instanceof ApiError && error.status === 401) {
				logger.warn('[AuthStore] Refresh token refused, ending the session locally');
				await endSessionLocally();
				return false;
			}

			set({ isRefreshing: false });
			logger.warn('[AuthStore] Keeping the session after a refresh failure; will retry later');
			return false;
		}
	}

	return async () => {
		if (inFlight) return inFlight;

		const { refreshToken } = get();
		if (!refreshToken) {
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
