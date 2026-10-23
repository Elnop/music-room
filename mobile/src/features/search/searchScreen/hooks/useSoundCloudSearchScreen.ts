import { useState, useMemo, useEffect, useCallback } from 'react';
import { debounce } from '@/shared/utils/debounce';
import { showError } from '@/shared/utils/toast';
import { toTrackInput } from '@/shared/utils/trackInput';
import { getPlayback, usePlayerHeight } from '@/shared/services/playbackBridge';
import { useSoundCloudSearch } from '@/features/search/hooks/useSoundCloudSearch';
import type { SoundCloudTrack } from '@/features/search/types';
import type { AddQueueItemBody } from '@/shared/types/playback';

export function useSoundCloudSearchScreen() {
	const playerHeight = usePlayerHeight();

	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState('');
	// A typed query waiting for its debounce counts as loading.
	const [isPending, setIsPending] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [actionTrack, setActionTrack] = useState<AddQueueItemBody | null>(null);

	const debouncedSetQuery = useMemo(
		() =>
			debounce((text: string) => {
				setIsPending(false);
				setDebouncedQuery(text);
			}, 500),
		[]
	);

	useEffect(() => () => debouncedSetQuery.cancel(), [debouncedSetQuery]);

	const { data: tracks, isFetching, isError, refetch } = useSoundCloudSearch(debouncedQuery);

	useEffect(() => {
		if (isError && debouncedQuery.trim()) {
			showError('La recherche SoundCloud a échoué. Réessayez.');
		}
	}, [isError, debouncedQuery]);

	const handleSearchChange = useCallback(
		(text: string) => {
			setSearchQuery(text);
			if (text.trim()) {
				setIsPending(true);
				debouncedSetQuery(text.trim());
			} else {
				debouncedSetQuery.cancel();
				setIsPending(false);
				setDebouncedQuery('');
			}
		},
		[debouncedSetQuery]
	);

	const handleRefresh = useCallback(async () => {
		if (!debouncedQuery.trim()) return;
		debouncedSetQuery.cancel();
		setIsPending(false);
		setIsRefreshing(true);
		try {
			await refetch();
		} finally {
			setIsRefreshing(false);
		}
	}, [debouncedQuery, debouncedSetQuery, refetch]);

	const handlePlay = useCallback((track: SoundCloudTrack) => {
		void getPlayback().playListTrack(track);
	}, []);

	const handleAddToQueue = useCallback((track: SoundCloudTrack) => {
		void getPlayback().addToQueue(toTrackInput(track));
	}, []);

	const handleShowActions = useCallback((track: SoundCloudTrack) => {
		setActionTrack(toTrackInput(track));
	}, []);

	const handleCloseActions = useCallback(() => {
		setActionTrack(null);
	}, []);

	const searchResults = debouncedQuery.trim() ? (tracks ?? []) : [];
	const isLoading = (isFetching || isPending) && Boolean(searchQuery.trim());

	return {
		searchQuery,
		debouncedQuery,
		isPending,
		isRefreshing,
		isLoading,
		isError,
		searchResults,
		actionTrack,
		playerHeight,
		handleSearchChange,
		handleRefresh,
		handleRetry: handleRefresh,
		handlePlay,
		handleAddToQueue,
		handleShowActions,
		handleCloseActions,
	};
}
