import { create } from 'zustand';
import type { SoundCloudSearchResult, SoundCloudTrack } from '@/types/soundcloud.types';
import { apiRequest } from '@/services/api';

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

			const data = await apiRequest<SoundCloudSearchResult>(
				`/api/soundcloud/search?${params.toString()}`
			);

			set({
				searchResults: data.collection || [],
				totalResults: data.total_results || 0,
				isSearching: false,
			});
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
