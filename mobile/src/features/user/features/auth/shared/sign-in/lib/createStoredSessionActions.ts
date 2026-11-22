import * as storedSession from '@/features/user/features/auth/shared/sign-in/lib/sessionStorage';
import { logger } from '@/shared/logging/logger';
import type {
	SessionAccess,
	SessionActions,
	SetAuthState,
} from '@/features/user/features/auth/shared/sign-in/types/authStateTypes';

type StoredSessionActions = Pick<SessionActions, 'loadFromStorage' | 'setAvatarUrl' | 'setUser'>;

async function loadStoredSession(set: SetAuthState): Promise<void> {
	try {
		const stored = await storedSession.load();
		if (stored) set({ ...stored, isAuthenticated: true });
	} catch (error) {
		logger.error('Failed to load auth state from storage:', error);
		await storedSession.clear();
	}
}

export function createStoredSessionActions({
	set,
	get,
	writer,
}: SessionAccess): StoredSessionActions {
	return {
		loadFromStorage: () => loadStoredSession(set),
		setAvatarUrl: async (avatarUrl) => {
			const { user } = get();
			if (!user) return;
			set({ user: { ...user, avatarUrl: avatarUrl ?? undefined } });
			await writer.persist();
		},
		setUser: async (user) => {
			set({ user });
			await writer.persist();
		},
	};
}
