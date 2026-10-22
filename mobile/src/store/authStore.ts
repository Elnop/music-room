import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@/types/user.types';
import type { LinkedProvider, OAuthProvider } from '@/types/auth.types';
import type { RegisterInput } from '@/shared/utils/validators';
import { authApi, ApiError, registerAuthSession } from '@/shared/services/api';
import { signInWithGoogle, signInWithFacebook } from '@/services/oauth';
import { lastTrackStorage } from '@/shared/services/lastTrackStorage';
import { usePlayerStore } from './playerStore';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';

// AsyncStorage keys
const STORAGE_KEYS = {
	AUTH_USER: '@zumik/auth_user',
	ACCESS_TOKEN: '@zumik/access_token',
	REFRESH_TOKEN: '@zumik/refresh_token',
	IS_AUTHENTICATED: '@zumik/is_authenticated',
	TOKEN_EXPIRES_AT: '@zumik/token_expires_at',
} as const;

/** The refresh request in flight, shared by concurrent callers. */
let inFlightRefresh: Promise<boolean> | null = null;

/** Session key of the auth SDK the app used before #376 (`sb-<project ref>-auth-token`). */
const LEGACY_SDK_SESSION_KEY = /^sb-.+-auth-token$/;

/**
 * Auth State Interface
 */
interface AuthState {
	user: UserProfile | null;
	accessToken: string | null;
	refreshToken: string | null;
	tokenExpiresAt: number | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	isRefreshing: boolean;
	error: string | null;
	linkedProviders: LinkedProvider[] | null;

	// Actions
	login: (email: string, password: string) => Promise<void>;
	register: (
		data: RegisterInput
	) => Promise<{ requiresVerification: boolean; userId?: string; email?: string }>;
	loginWithGoogle: () => Promise<void>;
	loginWithFacebook: () => Promise<void>;
	logout: () => Promise<void>;
	/** New avatar URL after an upload, null after a removal (#351) */
	setAvatarUrl: (avatarUrl: string | null) => Promise<void>;

	// Email verification
	verifyEmail: (userId: string, code: string) => Promise<void>;
	resendVerificationCode: (userId: string, email: string) => Promise<void>;

	// Password reset
	forgotPassword: (email: string) => Promise<void>;
	resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
	canResendResetCode: (email: string) => Promise<{ canResend: boolean; remainingSeconds: number }>;

	// Token refresh
	refreshAccessToken: () => Promise<boolean>;
	isTokenExpiringSoon: () => boolean;

	// Provider management
	fetchLinkedProviders: () => Promise<void>;
	linkProvider: (provider: OAuthProvider) => Promise<void>;
	unlinkProvider: (provider: OAuthProvider) => Promise<void>;

	// Storage helpers
	loadFromStorage: () => Promise<void>;
	saveToStorage: () => Promise<void>;
	clearStorage: () => Promise<void>;

	// Error handling
	clearError: () => void;
}

/**
 * Auth Store
 * Manages the session; every auth action goes through the backend API
 */
export const useAuthStore = create<AuthState>((set, get) => ({
	// Initial state
	user: null,
	accessToken: null,
	refreshToken: null,
	tokenExpiresAt: null,
	isAuthenticated: false,
	isLoading: false,
	isRefreshing: false,
	error: null,
	linkedProviders: null,

	/**
	 * Login with email and password
	 */
	login: async (email: string, password: string) => {
		set({ isLoading: true, error: null });

		try {
			const response = await authApi.login({ email, password });

			if (response.session) {
				set({
					user: response.user,
					accessToken: response.session.accessToken,
					refreshToken: response.session.refreshToken,
					tokenExpiresAt: response.session.expiresAt * 1000,
					isAuthenticated: true,
					isLoading: false,
				});
			} else {
				set({
					isLoading: false,
				});
			}

			await get().saveToStorage();
		} catch (error) {
			const errorMessage = apiErrorMessage(error, 'Connexion impossible, réessayez');
			set({
				error: errorMessage,
				isLoading: false,
				isAuthenticated: false,
				user: null,
				accessToken: null,
				refreshToken: null,
				tokenExpiresAt: null,
			});
			throw error;
		}
	},

	/**
	 * Register new user
	 */
	register: async (data: RegisterInput) => {
		set({ isLoading: true, error: null });

		try {
			const response = await authApi.register(data);

			if (response.requiresVerification) {
				set({ isLoading: false });
				return {
					requiresVerification: true,
					userId: response.user.id,
					email: data.email,
				};
			}

			set({
				user: response.user,
				accessToken: response.session!.accessToken,
				refreshToken: response.session!.refreshToken,
				tokenExpiresAt: response.session!.expiresAt * 1000,
				isAuthenticated: true,
				isLoading: false,
			});

			await get().saveToStorage();
			return { requiresVerification: false };
		} catch (error) {
			const errorMessage = apiErrorMessage(error, 'Inscription impossible, réessayez');
			set({
				error: errorMessage,
				isLoading: false,
				isAuthenticated: false,
				user: null,
				accessToken: null,
				refreshToken: null,
				tokenExpiresAt: null,
			});
			throw error;
		}
	},

	/**
	 * Verify email with 6-digit code
	 */
	verifyEmail: async (userId: string, code: string) => {
		set({ isLoading: true, error: null });

		try {
			const response = await authApi.verifyEmail(userId, code);

			set({
				user: response.user,
				accessToken: response.session!.accessToken,
				refreshToken: response.session!.refreshToken,
				tokenExpiresAt: response.session!.expiresAt * 1000,
				isAuthenticated: true,
				isLoading: false,
			});

			await get().saveToStorage();
		} catch (error) {
			const errorMessage = apiErrorMessage(error, 'Vérification impossible, réessayez');
			set({
				error: errorMessage,
				isLoading: false,
			});
			throw error;
		}
	},

	/**
	 * Resend verification code
	 */
	resendVerificationCode: async (userId: string, email: string) => {
		set({ error: null });

		try {
			await authApi.resendVerificationCode(userId, email);
		} catch (error) {
			const errorMessage = apiErrorMessage(error, "Impossible d'envoyer un nouveau code");
			set({ error: errorMessage });
			throw error;
		}
	},

	/**
	 * Request password reset (send email with code)
	 */
	forgotPassword: async (email: string) => {
		set({ isLoading: true, error: null });

		try {
			await authApi.forgotPassword(email);
			set({ isLoading: false });
		} catch (error) {
			const errorMessage = apiErrorMessage(
				error,
				"Impossible d'envoyer le code de réinitialisation"
			);
			set({ error: errorMessage, isLoading: false });
			throw error;
		}
	},

	/**
	 * Reset password with code
	 */
	resetPassword: async (email: string, code: string, newPassword: string) => {
		set({ isLoading: true, error: null });

		try {
			await authApi.resetPassword(email, code, newPassword);
			set({ isLoading: false });
		} catch (error) {
			const errorMessage = apiErrorMessage(error, 'Impossible de réinitialiser le mot de passe');
			set({ error: errorMessage, isLoading: false });
			throw error;
		}
	},

	/**
	 * Check if user can resend reset code
	 */
	canResendResetCode: async (email: string) => {
		const result = await authApi.canResendResetCode(email);
		return result;
	},

	/**
	 * Logout current user: revoke the session on the backend, then end it on
	 * the device even if the backend call fails (socketStore disconnects).
	 */
	logout: async () => {
		set({ isLoading: true, error: null });

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

	/**
	 * Login with Google OAuth
	 */
	loginWithGoogle: async () => {
		set({ isLoading: true, error: null });

		try {
			const idToken = await signInWithGoogle();
			const response = await authApi.loginWithGoogle(idToken);

			if (!response.session) {
				throw new Error('OAuth login did not return a session');
			}

			set({
				user: response.user,
				accessToken: response.session.accessToken,
				refreshToken: response.session.refreshToken,
				tokenExpiresAt: response.session.expiresAt * 1000,
				isAuthenticated: true,
				isLoading: false,
			});

			await get().saveToStorage();
		} catch (error) {
			if (__DEV__) {
				logger.error('[AuthStore] loginWithGoogle failed:', {
					errorType: error?.constructor?.name,
					isApiError: error instanceof ApiError,
					errorMessage: error instanceof Error ? error.message : 'Unknown error',
					errorCode: error instanceof ApiError ? error.code : undefined,
					errorDetails: error instanceof ApiError ? error.details : undefined,
					fullError: error,
				});
			} else {
				logger.error('[AuthStore] loginWithGoogle failed:', {
					errorType: error?.constructor?.name,
					isApiError: error instanceof ApiError,
					errorMessage: error instanceof Error ? error.message : 'Unknown error',
					errorCode: error instanceof ApiError ? error.code : undefined,
				});
			}

			if (error instanceof Error && error.message === 'SIGN_IN_CANCELLED') {
				set({ isLoading: false, error: null });
			} else {
				let errorMessage = 'La connexion avec Google a échoué. Réessayez.';

				if (error instanceof ApiError) {
					errorMessage = apiErrorMessage(error, errorMessage);
				} else if (error instanceof Error) {
					if (error.message === 'Google Play Services not available') {
						errorMessage =
							'Google Play Services est indisponible. Mettez-le à jour puis réessayez.';
					} else if (error.message === 'Sign-in already in progress') {
						errorMessage = 'Une connexion est déjà en cours, patientez.';
					} else if (error.message.includes('network') || error.message.includes('timeout')) {
						errorMessage = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
					}
				}

				set({
					isLoading: false,
					error: errorMessage,
				});
			}
		}
	},

	/**
	 * Login with Facebook OAuth
	 */
	loginWithFacebook: async () => {
		set({ isLoading: true, error: null });

		try {
			const accessToken = await signInWithFacebook();
			const response = await authApi.loginWithFacebook(accessToken);

			if (!response.session) {
				throw new Error('OAuth login did not return a session');
			}

			set({
				user: response.user,
				accessToken: response.session.accessToken,
				refreshToken: response.session.refreshToken,
				tokenExpiresAt: response.session.expiresAt * 1000,
				isAuthenticated: true,
				isLoading: false,
			});

			await get().saveToStorage();
		} catch (error) {
			if (__DEV__) {
				logger.error('[AuthStore] loginWithFacebook failed:', {
					errorType: error?.constructor?.name,
					isApiError: error instanceof ApiError,
					errorMessage: error instanceof Error ? error.message : 'Unknown error',
					errorCode: error instanceof ApiError ? error.code : undefined,
					errorDetails: error instanceof ApiError ? error.details : undefined,
					fullError: error,
				});
			} else {
				logger.error('[AuthStore] loginWithFacebook failed:', {
					errorType: error?.constructor?.name,
					isApiError: error instanceof ApiError,
					errorMessage: error instanceof Error ? error.message : 'Unknown error',
					errorCode: error instanceof ApiError ? error.code : undefined,
				});
			}

			if (error instanceof Error && error.message === 'SIGN_IN_CANCELLED') {
				set({ isLoading: false, error: null });
			} else {
				let errorMessage = 'La connexion avec Facebook a échoué. Réessayez.';

				if (error instanceof ApiError) {
					errorMessage = apiErrorMessage(error, errorMessage);
				} else if (error instanceof Error) {
					if (error.message.includes('not configured')) {
						errorMessage = "La connexion avec Facebook n'est pas configurée.";
					} else if (error.message.includes('network') || error.message.includes('timeout')) {
						errorMessage = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
					}
				}

				set({
					isLoading: false,
					error: errorMessage,
				});
			}
		}
	},

	/** Set the user's avatar after an upload (URL) or a removal (null), and persist it (#351) */
	setAvatarUrl: async (avatarUrl: string | null) => {
		const { user } = get();
		if (!user) return;

		set({ user: { ...user, avatarUrl: avatarUrl ?? undefined } });
		await get().saveToStorage();
	},

	/**
	 * Load auth state from AsyncStorage
	 */
	loadFromStorage: async () => {
		try {
			await removeLegacySdkSession();
			const [userJson, accessToken, refreshToken, isAuthJson, expiresAtStr] = await Promise.all([
				AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER),
				AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
				AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
				AsyncStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED),
				AsyncStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT),
			]);

			if (userJson && accessToken && isAuthJson === 'true') {
				const user: UserProfile = JSON.parse(userJson);
				const tokenExpiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : null;

				set({
					user,
					accessToken,
					refreshToken,
					tokenExpiresAt,
					isAuthenticated: true,
				});
			}
		} catch (error) {
			logger.error('Failed to load auth state from storage:', error);
			await get().clearStorage();
		}
	},

	/**
	 * Save auth state to AsyncStorage
	 */
	saveToStorage: async () => {
		const { user, accessToken, refreshToken, tokenExpiresAt, isAuthenticated } = get();

		try {
			if (user && accessToken && isAuthenticated) {
				await Promise.all([
					AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user)),
					AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
					AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken || ''),
					AsyncStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true'),
					AsyncStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, tokenExpiresAt?.toString() || ''),
				]);
			}
		} catch (error) {
			logger.error('Failed to save auth state to storage:', error);
		}
	},

	/**
	 * Clear auth state from AsyncStorage
	 */
	clearStorage: async () => {
		try {
			await Promise.all([
				AsyncStorage.removeItem(STORAGE_KEYS.AUTH_USER),
				AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
				AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
				AsyncStorage.removeItem(STORAGE_KEYS.IS_AUTHENTICATED),
				AsyncStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT),
				removeLegacySdkSession(),
			]);
		} catch (error) {
			logger.error('Failed to clear auth storage:', error);
		}
	},

	/**
	 * Fetch linked authentication providers
	 */
	fetchLinkedProviders: async () => {
		const { accessToken } = get();
		if (!accessToken) {
			throw new Error('No access token available');
		}

		try {
			const response = await authApi.getLinkedProviders(accessToken);
			set({ linkedProviders: response.providers });
		} catch (error) {
			logger.error('Failed to fetch linked providers:', error);
			throw error;
		}
	},

	/**
	 * Link an OAuth provider: native sign-in, then send its token to the backend.
	 * A cancelled sign-in rethrows Error('SIGN_IN_CANCELLED') without an API call.
	 */
	linkProvider: async (provider: OAuthProvider) => {
		const { accessToken } = get();
		if (!accessToken) {
			throw new Error('No access token available');
		}

		set({ isLoading: true, error: null });

		try {
			const token = provider === 'google' ? await signInWithGoogle() : await signInWithFacebook();
			const response = await authApi.linkProvider(accessToken, provider, token);

			set({ linkedProviders: response.providers, isLoading: false });
		} catch (error) {
			const cancelled = error instanceof Error && error.message === 'SIGN_IN_CANCELLED';
			const errorMessage = cancelled
				? null
				: apiErrorMessage(error, 'Impossible de lier ce compte');
			set({
				error: errorMessage,
				isLoading: false,
			});
			throw error;
		}
	},

	/**
	 * Unlink an OAuth provider
	 */
	unlinkProvider: async (provider: OAuthProvider) => {
		const { accessToken } = get();
		if (!accessToken) {
			throw new Error('No access token available');
		}

		set({ isLoading: true, error: null });

		try {
			await authApi.unlinkProvider(accessToken, provider);
			await get().fetchLinkedProviders();

			set({ isLoading: false });
		} catch (error) {
			const errorMessage = apiErrorMessage(error, 'Impossible de délier ce compte');
			set({
				error: errorMessage,
				isLoading: false,
			});
			throw error;
		}
	},

	/**
	 * Refresh access token using refresh token
	 */
	refreshAccessToken: async () => {
		const { refreshToken } = get();

		// Concurrent callers share the request in flight and get its outcome.
		if (inFlightRefresh) return inFlightRefresh;

		if (!refreshToken) {
			// Locally, not through logout(): its backend call would refresh again.
			logger.warn('[AuthStore] No refresh token available, ending the session locally');
			await endSessionLocally();
			return false;
		}

		set({ isRefreshing: true });

		inFlightRefresh = (async (): Promise<boolean> => {
			try {
				const response = await authApi.refreshToken(refreshToken);

				if (!response.session) {
					throw new Error('Token refresh did not return a session');
				}

				set({
					user: response.user,
					accessToken: response.session.accessToken,
					refreshToken: response.session.refreshToken,
					tokenExpiresAt: response.session.expiresAt * 1000,
					isAuthenticated: true,
					isRefreshing: false,
				});

				await get().saveToStorage();

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
		})().finally(() => {
			inFlightRefresh = null;
		});
		return inFlightRefresh;
	},

	/**
	 * Check if token is expired or about to expire
	 */
	isTokenExpiringSoon: () => {
		const { tokenExpiresAt } = get();
		if (!tokenExpiresAt) return true;

		const now = Date.now();
		const fiveMinutes = 5 * 60 * 1000;

		return tokenExpiresAt - now < fiveMinutes;
	},

	/**
	 * Clear error message
	 */
	clearError: () => {
		set({ error: null });
	},
}));

/**
 * Builds before #376 also kept the auth SDK's session (access and refresh
 * token) in AsyncStorage; nothing reads or revokes it any more, so drop it.
 */
async function removeLegacySdkSession(): Promise<void> {
	const keys = await AsyncStorage.getAllKeys();
	const legacy = keys.filter(key => LEGACY_SDK_SESSION_KEY.test(key));
	if (legacy.length > 0) await AsyncStorage.multiRemove(legacy);
}

/**
 * End the session on the device only, without calling the backend: for a
 * refused refresh, `authApi.logout` goes through `apiRequest`, whose proactive
 * refresh would call `refreshAccessToken` again.
 * RootNavigator shows the auth screens once `isAuthenticated` is false, and
 * socketStore disconnects.
 */
async function endSessionLocally(): Promise<void> {
	useAuthStore.setState({
		user: null,
		accessToken: null,
		refreshToken: null,
		tokenExpiresAt: null,
		isAuthenticated: false,
		isRefreshing: false,
		isLoading: false,
		error: null,
		linkedProviders: null,
	});

	await useAuthStore.getState().clearStorage();
}

/**
 * Every end of session empties the player (#312): a next user must not inherit
 * the track, which would skip their restore and be saved under their key. The
 * user is already null here, so the player no longer saves for anyone.
 */
useAuthStore.subscribe((state, previous) => {
	if (previous.isAuthenticated && !state.isAuthenticated) {
		usePlayerStore.getState().stop();
	}
});

registerAuthSession({
	getAccessToken: () => useAuthStore.getState().accessToken,
	isTokenExpiringSoon: () => useAuthStore.getState().isTokenExpiringSoon(),
	refreshAccessToken: () => useAuthStore.getState().refreshAccessToken(),
});
