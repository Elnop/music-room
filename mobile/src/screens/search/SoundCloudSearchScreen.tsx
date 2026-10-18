import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import type { Theme } from '@/themes/types';
import { useSoundCloudStore } from '@store/soundcloudStore';
import { useQueueStore } from '@store/queueStore';
import { toTrackInput } from '@utils/trackInput';
import { SoundCloudTrackItem } from '@screens/search/components/SoundCloudTrackItem';
import { TrackActionsSheet } from '@components/track/TrackActionsSheet';
import { SkeletonList, TrackRowSkeleton } from '@components/common/Skeleton';
import { EmptyState } from '@components/common/EmptyState';
import { SearchBar } from '@components/common/SearchBar';
import { showError } from '@utils/toast';
import debounce from 'lodash/debounce';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import type { AddQueueItemBody } from '@/types/queue.types';

export function SoundCloudSearchScreen() {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	const [searchQuery, setSearchQuery] = useState('');
	// A typed query waiting for its debounce counts as loading (#307).
	const [isPending, setIsPending] = useState(false);
	const [actionTrack, setActionTrack] = useState<AddQueueItemBody | null>(null);

	const { searchResults, isSearching, error, search, clearSearch, clearError } =
		useSoundCloudStore();
	const playListTrack = useQueueStore(state => state.playListTrack);
	const addToQueue = useQueueStore(state => state.addItem);

	// Debounced search
	const debouncedSearch = useMemo(
		() =>
			debounce((query: string) => {
				setIsPending(false);
				search(query);
			}, 500),
		[search]
	);

	useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

	// A failed search is a toast (#318); the store keeps its own (English) text.
	// `error` stays set until the next search so the list says the search failed.
	useEffect(() => {
		if (error) showError('La recherche SoundCloud a échoué. Réessayez.');
	}, [error]);

	const handleSearchChange = (text: string) => {
		setSearchQuery(text);
		clearError();
		if (text.trim()) {
			setIsPending(true);
			debouncedSearch(text);
		} else {
			debouncedSearch.cancel();
			setIsPending(false);
			clearSearch();
		}
	};

	const isLoading = isSearching || isPending;

	// Pull to refresh reruns the current query; with no query there is nothing to fetch.
	const [isRefreshing, setIsRefreshing] = useState(false);
	const handleRefresh = useCallback(async () => {
		if (!searchQuery.trim()) return;
		debouncedSearch.cancel();
		setIsPending(false);
		setIsRefreshing(true);
		clearError();
		try {
			await search(searchQuery, undefined, { keepResultsOnError: true });
		} finally {
			setIsRefreshing(false);
		}
	}, [searchQuery, debouncedSearch, search, clearError]);

	// On the phone, or on the remote device in remote mode (#297).
	const handlePlay = (track: SoundCloudTrack) => {
		void playListTrack(track);
	};

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<SearchBar
					value={searchQuery}
					onChangeText={handleSearchChange}
					placeholder="Rechercher sur SoundCloud..."
					loading={isLoading && !isRefreshing}
				/>
			</View>

			{isLoading && !isRefreshing && searchResults.length === 0 ? (
				<SkeletonList count={8} row={TrackRowSkeleton} />
			) : (
				<FlatList
					data={searchResults}
					refreshControl={
						<RefreshControl
							refreshing={isRefreshing}
							onRefresh={handleRefresh}
							tintColor={theme.colors.primary}
							colors={[theme.colors.primary]}
						/>
					}
					keyExtractor={item => item.id.toString()}
					renderItem={({ item }) => (
						<SoundCloudTrackItem
							track={item}
							onPlay={handlePlay}
							onAddToQueue={track => addToQueue(toTrackInput(track))}
							onShowActions={track => setActionTrack(toTrackInput(track))}
						/>
					)}
					contentContainerStyle={{
						paddingBottom: playerHeight + theme.spacing.xxl,
						flexGrow: 1,
					}}
					ListEmptyComponent={
						isLoading ? null : error && searchQuery.trim() ? (
							<EmptyState
								icon="cloud-offline-outline"
								message="La recherche a échoué"
								action={{ label: 'Réessayer', onPress: () => search(searchQuery) }}
							/>
						) : (
							<EmptyState
								icon="musical-notes-outline"
								message={
									searchQuery
										? 'Aucun titre trouvé'
										: 'Recherchez sur SoundCloud des titres à écouter ou à ajouter à vos playlists'
								}
							/>
						)
					}
				/>
			)}

			<TrackActionsSheet track={actionTrack} onClose={() => setActionTrack(null)} />
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		header: {
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.xs,
			paddingBottom: theme.spacing.md,
		},
	});
