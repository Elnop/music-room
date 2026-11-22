import * as authApi from '@/features/user/features/auth/shared/sign-in/lib/authApi';
import { ApiError } from '@/shared/backend/lib/ApiError';
import { logger } from '@/shared/logging/logger';
import type { SessionAccess } from '@/features/user/features/auth/shared/sign-in/types/authStateTypes';

async function handleRefreshFailure(
	error: unknown,
	{ set, writer }: SessionAccess,
): Promise<boolean> {
	logger.error('[AuthStore] Token refresh failed:', {
		error,
		errorMessage: error instanceof Error ? error.message : 'Unknown error',
		errorType: error?.constructor?.name,
	});

	if (error instanceof ApiError && error.status === 401) {
		logger.warn('[AuthStore] Refresh token refused, ending the session locally');
		await writer.endSessionLocally();
		return false;
	}

	set({ isRefreshing: false });
	logger.warn('[AuthStore] Keeping the session after a refresh failure; will retry later');
	return false;
}

async function refresh(refreshToken: string, access: SessionAccess): Promise<boolean> {
	try {
		const response = await authApi.refreshToken(refreshToken);
		if (!response.session) throw new Error('Token refresh did not return a session');

		access.writer.applySession(response.user, response.session);
		access.set({ isRefreshing: false });
		await access.writer.persist();
		return true;
	} catch (error) {
		return handleRefreshFailure(error, access);
	}
}

export function createTokenRefresh(access: SessionAccess): () => Promise<boolean> {
	let inFlight: Promise<boolean> | null = null;

	return async () => {
		if (inFlight) return inFlight;

		const { refreshToken } = access.get();
		if (!refreshToken) {
			logger.warn('[AuthStore] No refresh token available, ending the session locally');
			await access.writer.endSessionLocally();
			return false;
		}

		access.set({ isRefreshing: true });
		inFlight = refresh(refreshToken, access).finally(() => {
			inFlight = null;
		});
		return inFlight;
	};
}
