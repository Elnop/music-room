import * as authApi from '@/features/user/features/auth/shared/sign-in/lib/authApi';
import { lastTrackStorage } from '@/shared/playback/lastTrackStorage';
import { logger } from '@/shared/logging/logger';
import type { SessionAccess } from '@/features/user/features/auth/shared/sign-in/types/authStateTypes';

async function logoutFromBackend(accessToken: string | null): Promise<void> {
	if (!accessToken) return;
	try {
		await authApi.logout(accessToken);
	} catch (error) {
		logger.warn('Backend logout failed, continuing with local logout', error);
	}
}

export function createLogout({ set, get, writer }: SessionAccess): () => Promise<void> {
	return async () => {
		set({ isLoading: true });
		const { accessToken, user } = get();
		await logoutFromBackend(accessToken);
		await writer.endSessionLocally();
		if (user) {
			await lastTrackStorage
				.clear(user.id)
				.catch((error) => logger.warn('[lastTrackStorage] Clear failed', error));
		}
	};
}
