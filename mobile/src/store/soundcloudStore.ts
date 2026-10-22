import { create } from 'zustand';
import type { SoundCloudSearchResult, SoundCloudTrack } from '@/types/soundcloud.types';
import { apiRequest } from '@/shared/services/api';

interface SoundCloudState {
	searchResults: SoundCloudTrack[];
	isSearching: boolean;
	error: string | null;
	totalResults: number;

	// Actions
	/** `keepResultsOnError`: a failed search (e.g. a pull-refresh) keeps the shown results. */
	search: (
		query: string,
		limit?: number,
		options?: { keepResultsOnError?: boolean }
	) => Promise<void>;
	clearSearch: () => void;
	clearError: () => void;
}

// Number of the latest search: an answer to an older one, overtaken or cleared
// since, is dropped (#349).
let latestSearch = 0;

export const useSoundCloudStore = create<SoundCloudState>(set => ({
	searchResults: [],
	isSearching: false,
	error: null,
	totalResults: 0,

	search: async (query: string, limit = 20, options = {}) => {
		const searchId = ++latestSearch;
		if (!query.trim()) {
			set({ searchResults: [], totalResults: 0, isSearching: false });
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
			if (searchId !== latestSearch) return;

			set({
				searchResults: data.collection || [],
				totalResults: data.total_results || 0,
				isSearching: false,
			});
		} catch (error) {
			if (searchId !== latestSearch) return;
			set({
				error: error instanceof Error ? error.message : 'La recherche a échoué',
				isSearching: false,
				...(options.keepResultsOnError ? {} : { searchResults: [] }),
			});
		}
	},

	clearSearch: () => {
		latestSearch++;
		set({
			searchResults: [],
			totalResults: 0,
			error: null,
			isSearching: false,
		});
	},

	clearError: () => {
		set({ error: null });
	},
}));
