import React, { useState } from 'react';
import {
	View,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	Text,
	ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import type { Theme } from '@themes/types';
import { usePlaylistStore } from '@store/playlistStore';
import { useSoundCloudStore } from '@store/soundcloudStore';
import { useQueueStore } from '@store/queueStore';
import { QueueSwipe } from '@components/common/QueueSwipe';
import { SearchBar } from '@components/common/SearchBar';
import { Artwork } from '@components/common/Artwork';
import { PreviewBadge } from '@components/track/PreviewBadge';
import { isPreviewOnly } from '@utils/soundcloudPreview';
import { TrackActionsButton } from '@components/track/TrackActionsButton';
import { TrackActionsSheet } from '@components/track/TrackActionsSheet';
import { toTrackInput } from '@utils/trackInput';
import { EmptyState } from '@components/common/EmptyState';
import { SkeletonList, TrackRowSkeleton } from '@components/common/Skeleton';
import debounce from 'lodash/debounce';
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
	const { addTrack, currentPlaylist } = usePlaylistStore();
	const { searchResults, isSearching, search, clearSearch } = useSoundCloudStore();
	const addToQueue = useQueueStore(state => state.addItem);
	const [query, setQuery] = useState('');
	// A typed query waiting for its debounce counts as loading (#307).
	const [isPending, setIsPending] = useState(false);
	const [addingTrackId, setAddingTrackId] = useState<number | null>(null);
	const [addedTrackUris, setAddedTrackUris] = useState<Set<string>>(new Set());
	const [actionTrack, setActionTrack] = useState<AddQueueItemBody | null>(null);
	// The rows re-render when a track starts or ends being added: spinner, then check (#307).
	const rowState = React.useMemo(
		() => ({ addingTrackId, addedTrackUris }),
		[addingTrackId, addedTrackUris]
	);

	React.useEffect(() => {
		if (currentPlaylist?.tracks) {
			const existingUris = new Set(currentPlaylist.tracks.map(t => t.trackUri));
			setAddedTrackUris(existingUris);
		}
	}, [currentPlaylist?.tracks]);

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

	const handleAddTrack = async (track: SoundCloudTrack) => {
		if (addedTrackUris.has(track.permalink_url)) {
			return;
		}

		setAddingTrackId(track.id);
		try {
			// The backend generates the id; the cast only satisfies the store signature.
			await addTrack(playlistId, toTrackInput(track) as Track);

			setAddedTrackUris(prev => new Set(prev).add(track.permalink_url));
		} catch (error) {
			showError(apiErrorMessage(error, "Impossible d'ajouter le titre à la playlist"));
		} finally {
			setAddingTrackId(null);
		}
	};

	const formatDuration = (ms: number) => {
		const minutes = Math.floor(ms / 60000);
		const seconds = Math.floor((ms % 60000) / 1000);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	const renderTrackItem = ({ item }: { item: SoundCloudTrack }) => {
		const artworkUrl = item.artwork_url || item.user.avatar_url;
		const isAdding = addingTrackId === item.id;
		const isAdded = addedTrackUris.has(item.permalink_url);

		return (
			<View style={styles.trackRow}>
				<QueueSwipe onAddToQueue={() => addToQueue(toTrackInput(item))}>
					<TouchableOpacity
						style={styles.trackItem}
						onPress={() => !isAdded && handleAddTrack(item)}
						onLongPress={() => setActionTrack(toTrackInput(item))}
						// An added track keeps its long press: only the tap is a no-op.
						disabled={isAdding}
						activeOpacity={0.7}
					>
						<Artwork uri={artworkUrl} size={52} style={styles.artwork} />
						<View style={styles.trackInfo}>
							<Text style={styles.trackTitle} numberOfLines={1}>
								{item.title}
							</Text>
							<Text style={styles.trackArtist} numberOfLines={1}>
								{item.user.username}
							</Text>
							<View style={styles.trackMeta}>
								{isPreviewOnly(item) && <PreviewBadge />}
								<Text style={styles.trackDuration}>{formatDuration(item.duration)}</Text>
							</View>
						</View>
						<TrackActionsButton onPress={() => setActionTrack(toTrackInput(item))} />
						<View
							style={[
								styles.addButton,
								isAdding && styles.addButtonDisabled,
								isAdded && styles.addedButton,
							]}
						>
							{isAdding ? (
								<ActivityIndicator size="small" color="#FFFFFF" testID={`adding-${item.id}`} />
							) : (
								<Ionicons
									name={isAdded ? 'checkmark' : 'add'}
									size={20}
									color="#FFFFFF"
									testID={`${isAdded ? 'added' : 'add'}-${item.id}`}
								/>
							)}
						</View>
					</TouchableOpacity>
				</QueueSwipe>
			</View>
		);
	};

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
					extraData={rowState}
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
		// Spacing outside the swipe, so the queue panel matches the row's height.
		trackRow: {
			marginBottom: theme.spacing.xs,
		},
		trackItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingHorizontal: theme.spacing.md,
			paddingVertical: theme.spacing.sm,
			// Opaque so the queue panel stays hidden behind the row until swiped.
			backgroundColor: theme.colors.background,
		},
		artwork: {
			borderRadius: 8,
			marginRight: theme.spacing.md,
		},
		trackInfo: {
			flex: 1,
			// Keeps a long title off the buttons (#307).
			marginRight: theme.spacing.sm,
		},
		trackMeta: {
			flexDirection: 'row',
			alignItems: 'center',
			gap: theme.spacing.xs,
		},
		trackTitle: {
			fontSize: 15,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
			marginBottom: 3,
		},
		trackArtist: {
			fontSize: 13,
			color: theme.colors.textSecondary,
			marginBottom: 2,
		},
		trackDuration: {
			fontSize: 12,
			color: theme.colors.textSecondary,
		},
		addButton: {
			backgroundColor: theme.colors.primary,
			width: 36,
			height: 36,
			borderRadius: 18,
			justifyContent: 'center',
			alignItems: 'center',
			marginLeft: theme.spacing.sm,
		},
		addButtonDisabled: {
			opacity: 0.7,
		},
		addedButton: {
			backgroundColor: theme.colors.success,
		},
	});
