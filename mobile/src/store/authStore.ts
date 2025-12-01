import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@types';
import type { LoginInput, RegisterInput } from '@utils/validators';
import { authApi, ApiError } from '@services/api';
import { supabase } from '@/lib/supabase';

// AsyncStorage keys
const STORAGE_KEYS = {
  AUTH_USER: '@musicroom/auth_user',
  ACCESS_TOKEN: '@musicroom/access_token',
  REFRESH_TOKEN: '@musicroom/refresh_token',
  IS_AUTHENTICATED: '@musicroom/is_authenticated',
} as const;

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

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;

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
      const errorMessage =
        error instanceof ApiError ? error.message : 'Login failed';
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
      const errorMessage =
        error instanceof ApiError ? error.message : 'Registration failed';
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
    } catch (error) {
      set({
        error: 'Logout failed',
        isLoading: false,
      });
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
      const errorMessage =
        error instanceof Error ? error.message : 'Profile update failed';
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
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },
}));
