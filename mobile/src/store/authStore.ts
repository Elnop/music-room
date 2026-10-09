import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@/types/user.types';
import type { RegisterInput } from '@utils/validators';
import { authApi, ApiError, registerAuthSession } from '@services/api';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle, signInWithFacebook } from '@services/oauth';

// AsyncStorage keys
const STORAGE_KEYS = {
	AUTH_USER: '@zumik/auth_user',
	ACCESS_TOKEN: '@zumik/access_token',
	REFRESH_TOKEN: '@zumik/refresh_token',
	IS_AUTHENTICATED: '@zumik/is_authenticated',
	TOKEN_EXPIRES_AT: '@zumik/token_expires_at',
} as const;

/**
 * Linked provider info
 */
interface LinkedProvider {
	type: 'password' | 'google' | 'facebook';
	connectedAt: string;
	isPrimary: boolean;
}

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
	updateProfile: (data: Partial<UserProfile>) => Promise<void>;

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
	unlinkProvider: (provider: 'google' | 'facebook') => Promise<void>;

	// Storage helpers
	loadFromStorage: () => Promise<void>;
	saveToStorage: () => Promise<void>;
	clearStorage: () => Promise<void>;

	// Error handling
	clearError: () => void;
}

/**
 * Auth Store
 * Manages authentication state with Supabase and backend API
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

			await supabase.auth.signInWithPassword({
				email,
				password,
			});

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
			const errorMessage = error instanceof ApiError ? error.message : 'Login failed';
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
			const errorMessage = error instanceof ApiError ? error.message : 'Registration failed';
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
			const errorMessage = error instanceof ApiError ? error.message : 'Email verification failed';
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
			const errorMessage = error instanceof ApiError ? error.message : 'Failed to resend code';
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
			const errorMessage = error instanceof ApiError ? error.message : 'Failed to send reset code';
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
			const errorMessage = error instanceof ApiError ? error.message : 'Failed to reset password';
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
	 * Logout current user
	 */
	logout: async () => {
		set({ isLoading: true, error: null });

		try {
			const { accessToken } = get();

			if (accessToken) {
				try {
					await authApi.logout(accessToken);
				} catch (error) {
					console.warn('Backend logout failed, continuing with local logout', error);
				}
			}

			await supabase.auth.signOut();

			set({
				user: null,
				accessToken: null,
				refreshToken: null,
				tokenExpiresAt: null,
				isAuthenticated: false,
				isLoading: false,
				error: null,
			});

			await get().clearStorage();
		} catch (error) {
			console.error('[AuthStore] Logout failed:', error);
			set({
				error: 'Logout failed',
				isLoading: false,
			});
		}
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

			await supabase.auth.setSession({
				access_token: response.session.accessToken,
				refresh_token: response.session.refreshToken,
			});
		} catch (error) {
			if (__DEV__) {
				console.error('[AuthStore] loginWithGoogle failed:', {
					errorType: error?.constructor?.name,
					isApiError: error instanceof ApiError,
					errorMessage: error instanceof Error ? error.message : 'Unknown error',
					errorCode: error instanceof ApiError ? error.code : undefined,
					errorDetails: error instanceof ApiError ? error.details : undefined,
					fullError: error,
				});
			} else {
				console.error('[AuthStore] loginWithGoogle failed:', {
					errorType: error?.constructor?.name,
					isApiError: error instanceof ApiError,
					errorMessage: error instanceof Error ? error.message : 'Unknown error',
					errorCode: error instanceof ApiError ? error.code : undefined,
				});
			}

			if (error instanceof Error && error.message === 'SIGN_IN_CANCELLED') {
				set({ isLoading: false, error: null });
			} else {
				let errorMessage = 'Google login failed. Please try again.';

				if (error instanceof ApiError) {
					errorMessage = error.message;
				} else if (error instanceof Error) {
					if (error.message === 'Google Play Services not available') {
						errorMessage =
							'Google Play Services not available. Please update Google Play Services and try again.';
					} else if (error.message === 'Sign-in already in progress') {
						errorMessage = 'A sign-in is already in progress. Please wait.';
					} else if (error.message.includes('network') || error.message.includes('timeout')) {
						errorMessage = 'Network error. Please check your connection and try again.';
					} else {
						errorMessage = `Login failed: ${error.message}`;
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

			await supabase.auth.setSession({
				access_token: response.session.accessToken,
				refresh_token: response.session.refreshToken,
			});
		} catch (error) {
			if (__DEV__) {
				console.error('[AuthStore] loginWithFacebook failed:', {
					errorType: error?.constructor?.name,
					isApiError: error instanceof ApiError,
					errorMessage: error instanceof Error ? error.message : 'Unknown error',
					errorCode: error instanceof ApiError ? error.code : undefined,
					errorDetails: error instanceof ApiError ? error.details : undefined,
					fullError: error,
				});
			} else {
				console.error('[AuthStore] loginWithFacebook failed:', {
					errorType: error?.constructor?.name,
					isApiError: error instanceof ApiError,
					errorMessage: error instanceof Error ? error.message : 'Unknown error',
					errorCode: error instanceof ApiError ? error.code : undefined,
				});
			}

			if (error instanceof Error && error.message === 'SIGN_IN_CANCELLED') {
				set({ isLoading: false, error: null });
			} else {
				let errorMessage = 'Facebook login failed. Please try again.';

				if (error instanceof ApiError) {
					errorMessage = error.message;
				} else if (error instanceof Error) {
					if (error.message.includes('not configured')) {
						errorMessage = 'Facebook login is not configured. Please contact support.';
					} else if (error.message.includes('network') || error.message.includes('timeout')) {
						errorMessage = 'Network error. Please check your connection and try again.';
					} else {
						errorMessage = `Login failed: ${error.message}`;
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
	 * Update user profile
	 * Note: This is a placeholder for future implementation
	 */
	updateProfile: async (data: Partial<UserProfile>) => {
		const { user } = get();
		if (!user) {
			throw new Error('No user logged in');
		}

		set({ isLoading: true, error: null });

		try {
			// TODO: Implement backend API call for profile update
			const updatedUser: UserProfile = {
				...user,
				...data,
				updatedAt: new Date().toISOString(),
			};

			set({
				user: updatedUser,
				isLoading: false,
			});

			await get().saveToStorage();
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
			set({
				error: errorMessage,
				isLoading: false,
			});
			throw error;
		}
	},

	/**
	 * Load auth state from AsyncStorage
	 */
	loadFromStorage: async () => {
		try {
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
			console.error('Failed to load auth state from storage:', error);
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
			console.error('Failed to save auth state to storage:', error);
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
			]);
		} catch (error) {
			console.error('Failed to clear auth storage:', error);
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
			console.error('Failed to fetch linked providers:', error);
			throw error;
		}
	},

	/**
	 * Unlink an OAuth provider
	 */
	unlinkProvider: async (provider: 'google' | 'facebook') => {
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
			const errorMessage = error instanceof ApiError ? error.message : 'Failed to unlink provider';
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
		const { refreshToken, isRefreshing } = get();

		if (isRefreshing) {
			console.log('[AuthStore] Refresh already in progress, waiting...');
			return new Promise<boolean>(resolve => {
				let attempts = 0;
				const maxAttempts = 50;
				const checkInterval = setInterval(() => {
					attempts++;
					if (!get().isRefreshing) {
						clearInterval(checkInterval);
						console.log('[AuthStore] Refresh completed, continuing...');
						resolve(true);
					} else if (attempts >= maxAttempts) {
						clearInterval(checkInterval);
						console.error('[AuthStore] Refresh timeout - forcing reset');
						set({ isRefreshing: false });
						resolve(false);
					}
				}, 100);
			});
		}

		if (!refreshToken) {
			console.error('[AuthStore] No refresh token available');
			await get().logout();
			return false;
		}

		set({ isRefreshing: true });

		try {
			console.log('[AuthStore] Refreshing access token...', {
				refreshTokenLength: refreshToken.length,
				refreshTokenStart: refreshToken.substring(0, 20) + '...',
			});

			const response = await authApi.refreshToken(refreshToken);

			console.log('[AuthStore] Refresh API call successful, updating state...');

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

			await supabase.auth.setSession({
				access_token: response.session.accessToken,
				refresh_token: response.session.refreshToken,
			});

			console.log('[AuthStore] Token refreshed successfully');
			return true;
		} catch (error) {
			console.error('[AuthStore] Token refresh failed:', {
				error,
				errorMessage: error instanceof Error ? error.message : 'Unknown error',
				errorType: error?.constructor?.name,
			});

			// Only a 401 from the refresh call means the backend refused the
			// refresh token; anything else (network, 5xx, 503, 429) is an outage.
			// isRefreshing is reset with the cleared session, so waiting callers
			// never retry with the stale token.
			if (error instanceof ApiError && error.status === 401) {
				console.warn('[AuthStore] Refresh token refused, ending the session locally');
				await endSessionLocally();
				return false;
			}

			set({ isRefreshing: false });

			console.warn('[AuthStore] Keeping the session after a refresh failure; will retry later');
			return false;
		}
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
 * End the session without calling the backend: `authApi.logout` goes through
 * `apiRequest`, whose proactive refresh would call `refreshAccessToken` again.
 * RootNavigator shows the auth screens once `isAuthenticated` is false.
 */
async function endSessionLocally(): Promise<void> {
	try {
		await supabase.auth.signOut({ scope: 'local' });
	} catch (error) {
		console.warn('[AuthStore] Supabase local sign-out failed', error);
	}

	useAuthStore.setState({
		user: null,
		accessToken: null,
		refreshToken: null,
		tokenExpiresAt: null,
		isAuthenticated: false,
		isRefreshing: false,
		linkedProviders: null,
	});

	await useAuthStore.getState().clearStorage();
}

registerAuthSession({
	getAccessToken: () => useAuthStore.getState().accessToken,
	isTokenExpiringSoon: () => useAuthStore.getState().isTokenExpiringSoon(),
	refreshAccessToken: () => useAuthStore.getState().refreshAccessToken(),
});
