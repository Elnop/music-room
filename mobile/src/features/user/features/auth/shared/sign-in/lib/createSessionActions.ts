import { createSessionWriter } from '@/features/user/features/auth/shared/sign-in/lib/createSessionWriter';
import { createLogout } from '@/features/user/features/auth/shared/sign-in/lib/createLogout';
import { createTokenRefresh } from '@/features/user/features/auth/shared/sign-in/lib/createTokenRefresh';
import { createStoredSessionActions } from '@/features/user/features/auth/shared/sign-in/lib/createStoredSessionActions';
import type {
	GetAuthState,
	SessionActions,
	SetAuthState,
} from '@/features/user/features/auth/shared/sign-in/types/authStateTypes';

const EXPIRY_MARGIN_MS = 5 * 60 * 1000;

export function createSessionActions(set: SetAuthState, get: GetAuthState): SessionActions {
	const writer = createSessionWriter(set, get);
	const access = { set, get, writer };
	return {
		startSession: async (user, session) => {
			writer.applySession(user, session);
			await writer.persist();
		},
		logout: createLogout(access),
		refreshAccessToken: createTokenRefresh(access),
		isTokenExpiringSoon: () => {
			const { tokenExpiresAt } = get();
			return !tokenExpiresAt || tokenExpiresAt - Date.now() < EXPIRY_MARGIN_MS;
		},
		...createStoredSessionActions(access),
	};
}
