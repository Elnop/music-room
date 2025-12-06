import { create } from 'zustand';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { spotifyApi, ApiError } from '@/services/api';
import { useAuthStore } from './authStore';
import type { SpotifyConnectionStatus, SpotifyTrack, SpotifySearchResult } from '@/types';

WebBrowser.maybeCompleteAuthSession();

/**
 * Spotify State Interface
 */
interface SpotifyState {
  // Connection state
  connectionStatus: SpotifyConnectionStatus | null;
  isConnecting: boolean;
  isLoading: boolean;
  error: string | null;

  // Search state
  searchResults: SpotifyTrack[];
  isSearching: boolean;

  // Actions
  initiateConnection: () => Promise<void>;
  disconnect: () => Promise<void>;
  checkStatus: () => Promise<void>;
  search: (query: string) => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
}

/**
 * Spotify Store
 * Manages Spotify OAuth and API interactions
 */
export const useSpotifyStore = create<SpotifyState>((set, get) => ({
  // Initial state
  connectionStatus: null,
  isConnecting: false,
  isLoading: false,
  error: null,
  searchResults: [],
  isSearching: false,

  /**
   * Initiate Spotify connection (OAuth flow)
   */
  initiateConnection: async () => {
    set({ isConnecting: true, error: null });

    try {
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Get auth URL from backend
      const { authUrl, state } = await spotifyApi.initiateAuth(accessToken);

      // Open Spotify auth in browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        Linking.createURL('auth/spotify/callback')
      );

      if (result.type === 'success') {
        // Parse callback URL
        const url = Linking.parse(result.url);
        const code = url.queryParams?.code as string;
        const callbackState = url.queryParams?.state as string;
        const error = url.queryParams?.error as string;

        if (error) {
          throw new Error(`Spotify authorization failed: ${error}`);
        }

        if (!code || !callbackState) {
          throw new Error('Invalid callback parameters');
        }

        // Exchange code for tokens
        const status = await spotifyApi.exchangeCode(code, callbackState);

        // Update user profile in auth store
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          useAuthStore.setState({
            user: {
              ...currentUser,
              spotifyConnected: true,
            },
          });
        }

        set({
          connectionStatus: status,
          isConnecting: false,
        });
      } else if (result.type === 'cancel') {
        set({
          isConnecting: false,
          error: 'Spotify connection cancelled',
        });
      } else {
        throw new Error('Failed to complete Spotify authorization');
      }
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Connection failed';
      set({
        error: errorMessage,
        isConnecting: false,
      });
      throw error;
    }
  },

  /**
   * Disconnect Spotify account
   */
  disconnect: async () => {
    set({ isLoading: true, error: null });

    try {
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      await spotifyApi.disconnect(accessToken);

      // Update user profile in auth store
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.setState({
          user: {
            ...currentUser,
            spotifyConnected: false,
          },
        });
      }

      set({
        connectionStatus: { connected: false },
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : 'Disconnect failed';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },

  /**
   * Check Spotify connection status
   */
  checkStatus: async () => {
    set({ isLoading: true, error: null });

    try {
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const status = await spotifyApi.getStatus(accessToken);

      set({
        connectionStatus: status,
        isLoading: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : 'Failed to check status';
      set({
        error: errorMessage,
        isLoading: false,
      });
    }
  },

  /**
   * Search Spotify catalog
   */
  search: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    set({ isSearching: true, error: null });

    try {
      const { accessToken } = useAuthStore.getState();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      const result = await spotifyApi.search(accessToken, query, 'track', 20);

      set({
        searchResults: result.tracks?.items || [],
        isSearching: false,
      });
    } catch (error) {
      const errorMessage =
        error instanceof ApiError ? error.message : 'Search failed';
      set({
        error: errorMessage,
        isSearching: false,
        searchResults: [],
      });
    }
  },

  /**
   * Clear search results
   */
  clearSearch: () => {
    set({ searchResults: [], error: null });
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },
}));
