import React, { useState } from 'react';
import {
	View,
	FlatList,
	StyleSheet,
	TouchableOpacity,
	Text,
	TextInput,
	Image,
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
import { TrackActionsButton } from '@components/track/TrackActionsButton';
import { TrackActionsSheet } from '@components/track/TrackActionsSheet';
import { toTrackInput } from '@utils/trackInput';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingSpinner } from '@components/common/LoadingSpinner';
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
	const [addingTrackId, setAddingTrackId] = useState<number | null>(null);
	const [addedTrackUris, setAddedTrackUris] = useState<Set<string>>(new Set());
	const [actionTrack, setActionTrack] = useState<AddQueueItemBody | null>(null);

	React.useEffect(() => {
		if (currentPlaylist?.tracks) {
			const existingUris = new Set(currentPlaylist.tracks.map(t => t.trackUri));
			setAddedTrackUris(existingUris);
		}
	}, [currentPlaylist?.tracks]);

	const debouncedSearch = React.useMemo(
		() =>
			debounce((q: string) => {
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
		debouncedSearch(text);
	};

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
		const artworkUrl = item.artwork_url || item.user.avatar_url || 'https://via.placeholder.com/50';
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
						<Image source={{ uri: artworkUrl }} style={styles.artwork} />
						<View style={styles.trackInfo}>
							<Text style={styles.trackTitle} numberOfLines={1}>
								{item.title}
							</Text>
							<Text style={styles.trackArtist} numberOfLines={1}>
								{item.user.username}
							</Text>
							<Text style={styles.trackDuration}>{formatDuration(item.duration)}</Text>
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
								<ActivityIndicator size="small" color="#FFFFFF" />
							) : (
								<Ionicons name={isAdded ? 'checkmark' : 'add'} size={20} color="#FFFFFF" />
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
				<View style={styles.searchInputWrapper}>
					<Ionicons
						name="search"
						size={20}
						color={theme.colors.textSecondary}
						style={styles.searchIcon}
					/>
					<TextInput
						style={styles.searchInput}
						placeholder="Rechercher sur SoundCloud..."
						placeholderTextColor={theme.colors.textSecondary}
						value={query}
						onChangeText={handleSearchChange}
						autoCapitalize="none"
						autoCorrect={false}
						autoFocus
					/>
					{query.length > 0 && (
						<TouchableOpacity
							onPress={() => {
								setQuery('');
								clearSearch();
							}}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
						</TouchableOpacity>
					)}
				</View>
			</View>

			{isSearching && searchResults.length === 0 ? (
				<LoadingSpinner size="large" />
			) : (
				<FlatList
					data={searchResults}
					keyExtractor={item => item.id.toString()}
					renderItem={renderTrackItem}
					contentContainerStyle={[styles.list, { paddingBottom: playerHeight + theme.spacing.xl }]}
					showsVerticalScrollIndicator={false}
					ListEmptyComponent={
						query.trim() && isSearching ? null : (
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
		searchInputWrapper: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surfaceAlt,
			borderRadius: 12,
			paddingHorizontal: theme.spacing.md,
			height: 48,
		},
		searchIcon: {
			marginRight: theme.spacing.sm,
		},
		searchInput: {
			flex: 1,
			fontSize: 16,
			color: theme.colors.text,
			paddingVertical: 0,
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
			width: 52,
			height: 52,
			borderRadius: 8,
			backgroundColor: theme.colors.surfaceAlt,
			marginRight: theme.spacing.md,
		},
		trackInfo: {
			flex: 1,
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
