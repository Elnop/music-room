import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@types';
import type { LoginInput, RegisterInput } from '@utils/validators';
import {
  MOCK_CREDENTIALS,
  MOCK_USERS,
  findUserByEmail,
  isEmailTaken,
  isUsernameTaken,
} from '@mocks';
import { delay, generateId } from '@utils/mockHelpers';

// AsyncStorage keys
const STORAGE_KEYS = {
  AUTH_USER: '@musicroom/auth_user',
  IS_AUTHENTICATED: '@musicroom/is_authenticated',
} as const;

/**
 * Auth State Interface
 */
interface AuthState {
  user: UserProfile | null;
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
 * Manages authentication state with mock data and AsyncStorage persistence
 */
export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  /**
   * Login with email and password
   */
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      // Simulate network delay
      await delay(800);

      // Validate credentials
      if (
        email.toLowerCase() !== MOCK_CREDENTIALS.email.toLowerCase() ||
        password !== MOCK_CREDENTIALS.password
      ) {
        throw new Error('Invalid email or password');
      }

      // Find user
      const user = findUserByEmail(email);
      if (!user) {
        throw new Error('User not found');
      }

      // Set authenticated state
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });

      // Persist to storage
      await get().saveToStorage();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
        user: null,
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
      // Simulate network delay
      await delay(1000);

      // Check if email already exists
      if (isEmailTaken(data.email)) {
        throw new Error('Email already in use');
      }

      // Check if username already exists
      if (isUsernameTaken(data.username)) {
        throw new Error('Username already taken');
      }

      // Create new user
      const newUser: UserProfile = {
        id: generateId('user'),
        email: data.email,
        username: data.username,
        displayName: data.username, // Default to username
        avatarUrl: undefined,
        bio: undefined,
        spotifyConnected: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to mock users (in-memory)
      MOCK_USERS.push(newUser);

      // Set authenticated state
      set({
        user: newUser,
        isAuthenticated: true,
        isLoading: false,
      });

      // Persist to storage
      await get().saveToStorage();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
        user: null,
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
      // Simulate network delay
      await delay(300);

      // Clear state
      set({
        user: null,
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
   */
  updateProfile: async (data: Partial<UserProfile>) => {
    const { user } = get();
    if (!user) {
      throw new Error('No user logged in');
    }

    set({ isLoading: true, error: null });

    try {
      // Simulate network delay
      await delay(600);

      // Update user object
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
      const [userJson, isAuthJson] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_USER),
        AsyncStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED),
      ]);

      if (userJson && isAuthJson === 'true') {
        const user: UserProfile = JSON.parse(userJson);
        set({
          user,
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
    const { user, isAuthenticated } = get();

    try {
      if (user && isAuthenticated) {
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user)),
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
