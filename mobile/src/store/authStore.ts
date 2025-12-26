import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@types';
import type { RegisterInput } from '@utils/validators';
import { authApi, ApiError } from '@services/api';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle, signInWithFacebook } from '@services/oauth';

// AsyncStorage keys
const STORAGE_KEYS = {
  AUTH_USER: '@musicroom/auth_user',
  ACCESS_TOKEN: '@musicroom/access_token',
  REFRESH_TOKEN: '@musicroom/refresh_token',
  IS_AUTHENTICATED: '@musicroom/is_authenticated',
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
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  linkedProviders: LinkedProvider[] | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;

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
  isAuthenticated: false,
  isLoading: false,
  error: null,
  linkedProviders: null,

  /**
   * Login with email and password
   */
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      // Call backend API
      const response = await authApi.login({ email, password });

      // Also sign in to Supabase (for auth state sync)
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Set authenticated state
      set({
        user: response.user,
        accessToken: response.session.accessToken,
        refreshToken: response.session.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // Persist to storage
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
      // Call backend API
      const response = await authApi.register(data);

      // Set authenticated state
      set({
        user: response.user,
        accessToken: response.session.accessToken,
        refreshToken: response.session.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // Persist to storage
      await get().saveToStorage();
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Registration failed';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
      });
      throw error;
    }
  },

  /**
   * Logout current user
   */
  logout: async () => {
    set({ isLoading: true, error: null });

    try {
      const { accessToken } = get();

      // Call backend API to logout (if token exists)
      if (accessToken) {
        try {
          await authApi.logout(accessToken);
        } catch (error) {
          // Continue with logout even if API call fails
          console.warn('Backend logout failed, continuing with local logout', error);
        }
      }

      // Sign out from Supabase
      await supabase.auth.signOut();

      // Clear state
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });

      // Clear storage
      await get().clearStorage();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
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
      // 1. Get ID token from Google Sign-In
      const idToken = await signInWithGoogle();

      // 2. Send to backend
      const response = await authApi.loginWithGoogle(idToken);

      // 3. Set authenticated state
      set({
        user: response.user,
        accessToken: response.session.accessToken,
        refreshToken: response.session.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // 4. Persist to storage
      await get().saveToStorage();

      // 5. Set session in Supabase for consistency
      await supabase.auth.setSession({
        access_token: response.session.accessToken,
        refresh_token: response.session.refreshToken,
      });
    } catch (error) {
      // Log error details for debugging (detailed logs only in development)
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
        // Production: Only log safe, sanitized error info
        console.error('[AuthStore] loginWithGoogle failed:', {
          errorType: error?.constructor?.name,
          isApiError: error instanceof ApiError,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorCode: error instanceof ApiError ? error.code : undefined,
        });
      }

      // Handle specific error codes
      if (error instanceof Error && error.message === 'SIGN_IN_CANCELLED') {
        // User cancelled = no error visible
        set({ isLoading: false, error: null });
      } else {
        // Determine user-friendly error message
        let errorMessage = 'Google login failed. Please try again.';

        if (error instanceof ApiError) {
          // Use backend error message (already user-friendly)
          errorMessage = error.message;
        } else if (error instanceof Error) {
          // Use error message from oauth.ts or network layer
          if (error.message === 'Google Play Services not available') {
            errorMessage =
              'Google Play Services not available. Please update Google Play Services and try again.';
          } else if (error.message === 'Sign-in already in progress') {
            errorMessage = 'A sign-in is already in progress. Please wait.';
          } else if (error.message.includes('network') || error.message.includes('timeout')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else {
            // Fallback: show actual error message (but sanitized)
            errorMessage = `Login failed: ${error.message}`;
          }
        }

        set({
          isLoading: false,
          error: errorMessage,
        });
      }
      // Note: Error is not re-thrown as it's already handled by setting error state
      // Caller can check the error state instead of catching exceptions
    }
  },

  /**
   * Login with Facebook OAuth
   */
  loginWithFacebook: async () => {
    set({ isLoading: true, error: null });

    try {
      // 1. Get access token from Facebook Login
      const accessToken = await signInWithFacebook();

      // 2. Send to backend
      const response = await authApi.loginWithFacebook(accessToken);

      // 3. Set authenticated state
      set({
        user: response.user,
        accessToken: response.session.accessToken,
        refreshToken: response.session.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // 4. Persist to storage
      await get().saveToStorage();

      // 5. Set session in Supabase for consistency
      await supabase.auth.setSession({
        access_token: response.session.accessToken,
        refresh_token: response.session.refreshToken,
      });
    } catch (error) {
      // Log error details for debugging (detailed logs only in development)
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
        // Production: Only log safe, sanitized error info
        console.error('[AuthStore] loginWithFacebook failed:', {
          errorType: error?.constructor?.name,
          isApiError: error instanceof ApiError,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorCode: error instanceof ApiError ? error.code : undefined,
        });
      }

      // Handle specific error codes
      if (error instanceof Error && error.message === 'SIGN_IN_CANCELLED') {
        // User cancelled = no error visible
        set({ isLoading: false, error: null });
      } else {
        // Determine user-friendly error message
        let errorMessage = 'Facebook login failed. Please try again.';

        if (error instanceof ApiError) {
          // Use backend error message (already user-friendly)
          errorMessage = error.message;
        } else if (error instanceof Error) {
          // Use error message from oauth.ts or network layer
          if (error.message.includes('not configured')) {
            errorMessage = 'Facebook login is not configured. Please contact support.';
          } else if (error.message.includes('network') || error.message.includes('timeout')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else {
            // Fallback: show actual error message (but sanitized)
            errorMessage = `Login failed: ${error.message}`;
          }
        }

        set({
          isLoading: false,
          error: errorMessage,
        });
      }
      // Note: Error is not re-thrown as it's already handled by setting error state
      // Caller can check the error state instead of catching exceptions
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
      // For now, just update locally
      const updatedUser: UserProfile = {
        ...user,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      set({
        user: updatedUser,
        isLoading: false,
      });

      // Persist to storage
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
      const [userJson, accessToken, refreshToken, isAuthJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER),
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED),
      ]);

      if (userJson && accessToken && isAuthJson === 'true') {
        const user: UserProfile = JSON.parse(userJson);
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Failed to load auth state from storage:', error);
      // Clear potentially corrupted data
      await get().clearStorage();
    }
  },

  /**
   * Save auth state to AsyncStorage
   */
  saveToStorage: async () => {
    const { user, accessToken, refreshToken, isAuthenticated } = get();

    try {
      if (user && accessToken && isAuthenticated) {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user)),
          AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
          AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken || ''),
          AsyncStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, 'true'),
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

      // Refresh linked providers list
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
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },
}));
