import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { usePlaylistStore } from '@store/playlistStore';
import { useSoundCloudStore } from '@store/soundcloudStore';
import { useQueueStore } from '@store/queueStore';
import { SearchBar } from '@components/common/SearchBar';
import { TrackActionsSheet } from '@components/track/TrackActionsSheet';
import { AddableTrackRow } from '@components/track/AddableTrackRow';
import { toTrackInput } from '@utils/trackInput';
import { EmptyState } from '@components/common/EmptyState';
import { SkeletonList, TrackRowSkeleton } from '@components/common/Skeleton';
import { debounce } from '@/utils/debounce';
import type { SoundCloudTrack } from '@/types/soundcloud.types';
import type { Track } from '@/types/track.types';
import type { AddQueueItemBody } from '@/types/queue.types';
import { showError } from '@utils/toast';
import { apiErrorMessage } from '@utils/apiErrorMessage';

type PlaylistStackParamList = {
	Playlists: undefined;
	PlaylistDetail: { id: string };
	CreatePlaylist: undefined;
	SearchTracks: { playlistId: string };
};

type SearchTracksScreenNavigationProp = NativeStackNavigationProp<
	PlaylistStackParamList,
	'SearchTracks'
>;

type SearchTracksScreenRouteProp = RouteProp<PlaylistStackParamList, 'SearchTracks'>;

interface SearchTracksScreenProps {
	navigation: SearchTracksScreenNavigationProp;
	route: SearchTracksScreenRouteProp;
}

export function SearchTracksScreen({ route }: SearchTracksScreenProps) {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const { playlistId } = route.params;
	const addTrack = usePlaylistStore(state => state.addTrack);
	const playlistTracks = usePlaylistStore(state => state.currentPlaylist?.tracks);
	const { searchResults, isSearching, search, clearSearch } = useSoundCloudStore();
	const addToQueue = useQueueStore(state => state.addItem);
	const [query, setQuery] = useState('');
	// A typed query waiting for its debounce counts as loading (#307).
	const [isPending, setIsPending] = useState(false);
	// Tracks tapped here: checked at once, before the add call ends (#307).
	const [addedHere, setAddedHere] = useState<Set<string>>(new Set());
	// Calls in flight, so a double tap faster than a render sends one call.
	const sendingUris = React.useRef(new Set<string>());
	const [actionTrack, setActionTrack] = useState<AddQueueItemBody | null>(null);

	const playlistUris = React.useMemo(
		() => new Set((playlistTracks ?? []).map(t => t.trackUri)),
		[playlistTracks]
	);

	const debouncedSearch = React.useMemo(
		() =>
			debounce((q: string) => {
				setIsPending(false);
				if (q.trim()) {
					search(q);
				} else {
					clearSearch();
				}
			}, 500),
		[search, clearSearch]
	);

	React.useEffect(() => {
		return () => {
			debouncedSearch.cancel();
		};
	}, [debouncedSearch]);

	const handleSearchChange = (text: string) => {
		setQuery(text);
		if (text.trim()) {
			setIsPending(true);
			debouncedSearch(text);
		} else {
			// Cleared: drop the results now rather than after the debounce.
			debouncedSearch.cancel();
			setIsPending(false);
			clearSearch();
		}
	};

	const isLoading = isSearching || isPending;

	const handleAddTrack = React.useCallback(
		async (track: SoundCloudTrack) => {
			const uri = track.permalink_url;
			if (sendingUris.current.has(uri)) return;
			sendingUris.current.add(uri);
			setAddedHere(prev => new Set(prev).add(uri));
			try {
				// The backend generates the id; the cast only satisfies the store signature.
				await addTrack(playlistId, toTrackInput(track) as Track);
			} catch (error) {
				setAddedHere(prev => {
					const next = new Set(prev);
					next.delete(uri);
					return next;
				});
				showError(apiErrorMessage(error, "Impossible d'ajouter le titre à la playlist"));
			} finally {
				sendingUris.current.delete(uri);
			}
		},
		[addTrack, playlistId]
	);

	const handleAddToQueue = React.useCallback(
		(track: SoundCloudTrack) => addToQueue(toTrackInput(track)),
		[addToQueue]
	);

	const handleShowActions = React.useCallback(
		(track: SoundCloudTrack) => setActionTrack(toTrackInput(track)),
		[]
	);

	const renderTrackItem = ({ item }: { item: SoundCloudTrack }) => (
		<AddableTrackRow
			track={item}
			isAdded={addedHere.has(item.permalink_url) || playlistUris.has(item.permalink_url)}
			onAdd={handleAddTrack}
			onAddToQueue={handleAddToQueue}
			onShowActions={handleShowActions}
		/>
	);

	return (
		<View style={styles.container}>
			<View style={styles.searchContainer}>
				<SearchBar
					value={query}
					onChangeText={handleSearchChange}
					placeholder="Rechercher sur SoundCloud..."
					loading={isLoading}
					autoFocus
				/>
			</View>

			{isLoading && searchResults.length === 0 ? (
				<SkeletonList count={8} row={TrackRowSkeleton} />
			) : (
				<FlatList
					data={searchResults}
					keyExtractor={item => item.id.toString()}
					renderItem={renderTrackItem}
					contentContainerStyle={[styles.list, { paddingBottom: playerHeight + theme.spacing.xl }]}
					showsVerticalScrollIndicator={false}
					ListEmptyComponent={
						query.trim() && isLoading ? null : (
							<EmptyState
								icon="musical-notes-outline"
								message={
									query.trim()
										? 'Aucun titre trouvé'
										: 'Recherchez des titres sur SoundCloud pour les ajouter à votre playlist'
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
		searchContainer: {
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
		},
		list: {
			flexGrow: 1,
			paddingTop: theme.spacing.sm,
		},
	});
