import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import type { TextInput } from 'react-native';
import { debounce } from '@/shared/debounce/debounce';
import { showError } from '@/shared/theme/lib/toast';
import { toTrackInput } from '@/shared/tracks/lib/trackInput';
import type { PlaybackActions } from '@/shared/playback/lib/playbackActions';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useSoundCloudSearch } from '@/features/search/hooks/useSoundCloudSearch';
import { useSearchFocusStore } from '@/features/search/searchFocusStore';
import type { SoundCloudTrack } from '@/features/search/lib/types';
import type { AddQueueItemBody } from '@/shared/playback/lib/playback';
import { recordMenuAnchor } from '@/shared/theme/menuAnchorStore';
import type { MenuAnchor } from '@/shared/theme/lib/menuPlacement';

export function useSoundCloudSearchScreen(playback: PlaybackActions) {
	const bottomPadding = useBottomPadding();
	const inputRef = useRef<TextInput>(null);
	const focusPending = useSearchFocusStore(state => state.pending);
	const consumeFocus = useSearchFocusStore(state => state.consume);

	useEffect(() => {
		if (!focusPending) return;
		inputRef.current?.focus();
		consumeFocus();
	}, [focusPending, consumeFocus]);

	const [searchQuery, setSearchQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState('');
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
		void playback.playListTrack(track);
	}, []);

	const handleAddToQueue = useCallback((track: SoundCloudTrack) => {
		void playback.addToQueue(toTrackInput(track));
	}, []);

	const handleShowActions = useCallback((track: SoundCloudTrack, anchor?: MenuAnchor) => {
		recordMenuAnchor(anchor);
		setActionTrack(toTrackInput(track));
	}, []);

	const handleCloseActions = useCallback(() => {
		setActionTrack(null);
	}, []);

	const searchResults = debouncedQuery.trim() ? (tracks ?? []) : [];
	const isLoading = (isFetching || isPending) && Boolean(searchQuery.trim());

	return {
		inputRef,
		searchQuery,
		debouncedQuery,
		isPending,
		isRefreshing,
		isLoading,
		isError,
		searchResults,
		actionTrack,
		bottomPadding,
		handleSearchChange,
		handleRefresh,
		handleRetry: handleRefresh,
		handlePlay,
		handleAddToQueue,
		handleShowActions,
		handleCloseActions,
	};
}
