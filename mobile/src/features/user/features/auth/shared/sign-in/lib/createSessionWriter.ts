import * as storedSession from '@/features/user/features/auth/shared/sign-in/lib/sessionStorage';
import { SIGNED_OUT } from '@/features/user/features/auth/shared/sign-in/configs/sessionConfig';
import type {
	GetAuthState,
	SessionWriter,
	SetAuthState,
} from '@/features/user/features/auth/shared/sign-in/types/authStateTypes';

export function createSessionWriter(set: SetAuthState, get: GetAuthState): SessionWriter {
	return {
		applySession: (user, session) => {
			set({
				user,
				accessToken: session.accessToken,
				refreshToken: session.refreshToken,
				tokenExpiresAt: session.expiresAt * 1000,
				isAuthenticated: true,
			});
		},
		persist: async () => {
			const { user, accessToken, refreshToken, tokenExpiresAt, isAuthenticated } = get();
			if (user && accessToken && isAuthenticated) {
				await storedSession.save({ user, accessToken, refreshToken, tokenExpiresAt });
			}
		},
		endSessionLocally: async () => {
			set(SIGNED_OUT);
			await storedSession.clear();
		},
	};
}
