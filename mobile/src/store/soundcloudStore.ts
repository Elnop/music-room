import { create } from 'zustand';
import type { SoundCloudTrack } from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface SoundCloudState {
  searchResults: SoundCloudTrack[];
  isSearching: boolean;
  error: string | null;
  totalResults: number;

  // Actions
  search: (query: string, limit?: number) => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
}

export const useSoundCloudStore = create<SoundCloudState>(set => ({
  searchResults: [],
  isSearching: false,
  error: null,
  totalResults: 0,

  search: async (query: string, limit = 20) => {
    if (!query.trim()) {
      set({ searchResults: [], totalResults: 0 });
      return;
    }

    set({ isSearching: true, error: null });

    try {
      const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
      });

      const response = await fetch(`${API_URL}/api/soundcloud/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        set({
          searchResults: data.data.collection || [],
          totalResults: data.data.total_results || 0,
          isSearching: false,
        });
      } else {
        throw new Error(data.error?.message || 'Search failed');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Search failed',
        isSearching: false,
        searchResults: [],
      });
    }
  },

  clearSearch: () => {
    set({
      searchResults: [],
      totalResults: 0,
      error: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
