import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { showError, showSuccess } from '@utils/toast';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useImageColors, hexToRgba } from '@/hooks/useImageColors';
import type { Theme } from '@themes/types';
import type { Track } from '@/types/track.types';
import { CONFLICT_CODES, usePlaylistStore } from '@store/playlistStore';
import { afterRankForDrop } from '@store/moveTarget';
import { trackToSoundCloud } from '@utils/trackToSoundCloud';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@store/authStore';
import { usePlayerStore } from '@store/playerStore';
import { useQueueStore } from '@store/queueStore';
import { toTrackInput } from '@utils/trackInput';
import { usePlaylistSocket } from '@hooks/usePlaylistSocket';
import { PlaylistHeader } from '@components/playlist/PlaylistHeader';
import { SwipeableTrackItem } from '@components/common/SwipeableTrackItem';
import { ReorderableList } from '@components/common/ReorderableList';
import { EmptyState } from '@components/common/EmptyState';
import { LoadingSpinner } from '@components/common/LoadingSpinner';

type PlaylistStackParamList = {
	Playlists: undefined;
	PlaylistDetail: { id: string };
	CreatePlaylist: undefined;
	SearchTracks: { playlistId: string };
	PlaylistSharing: { playlistId: string };
};

type PlaylistDetailScreenNavigationProp = NativeStackNavigationProp<
	PlaylistStackParamList,
	'PlaylistDetail'
>;

type PlaylistDetailScreenRouteProp = RouteProp<PlaylistStackParamList, 'PlaylistDetail'>;

interface PlaylistDetailScreenProps {
	navigation: PlaylistDetailScreenNavigationProp;
	route: PlaylistDetailScreenRouteProp;
}

export function PlaylistDetailScreen({ navigation, route }: PlaylistDetailScreenProps) {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme, insets.top), [theme, insets.top]);
	const { id } = route.params;
	const { user } = useAuthStore();
	const addToQueue = useQueueStore(state => state.addItem);
	const {
		currentPlaylist,
		isLoading,
		fetchPlaylistById,
		removeTrack,
		moveTrack,
		pendingMoves,
		conflictMessage,
		clearConflictMessage,
	} = usePlaylistStore();
	const {
		currentTrack,
		isPlaying,
		loading: playerLoading,
		playTrack,
		pause,
		resume,
	} = usePlayerStore();

	const coverUrl = currentPlaylist?.coverUrl || currentPlaylist?.tracks[0]?.albumArt;
	const { dominantColor } = useImageColors(coverUrl, theme.colors.primary);

	const isOwner = user && currentPlaylist?.ownerId === user.id;

	const canEdit = React.useMemo(() => {
		if (!user || !currentPlaylist) return false;
		if (currentPlaylist.ownerId === user.id) return true;
		if (currentPlaylist.collaboratorIds.includes(user.id)) return true;
		if (currentPlaylist.editMode === 'open') {
			if (currentPlaylist.visibility === 'public') return true;
			if (currentPlaylist.viewerIds?.includes(user.id)) return true;
		}
		return false;
	}, [user, currentPlaylist]);

	usePlaylistSocket(id);

	// A move refused because someone else changed the track: the store reloaded it.
	React.useEffect(() => {
		if (!conflictMessage) return;
		showError(conflictMessage);
		clearConflictMessage();
	}, [conflictMessage, clearConflictMessage]);

	// A message left by this screen must not show on the next playlist opened.
	React.useEffect(() => () => clearConflictMessage(), [clearConflictMessage]);

	useFocusEffect(
		React.useCallback(() => {
			fetchPlaylistById(id);
		}, [id, fetchPlaylistById])
	);

	const handleShare = useCallback(() => {
		navigation.navigate('PlaylistSharing', { playlistId: id });
	}, [navigation, id]);

	// Configure header natif transparent avec bouton partage
	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerTransparent: true,
			headerTitle: '',
			headerRight: isOwner
				? () => (
						<Pressable
							onPress={handleShare}
							style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}
						>
							<Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
						</Pressable>
					)
				: undefined,
		});
	}, [navigation, isOwner, handleShare, theme.colors.text]);

	const handleAddTrack = () => {
		navigation.navigate('SearchTracks', { playlistId: id });
	};

	const handlePlayTrack = (track: Track) => {
		const isCurrentTrack = currentTrack?.permalink_url === track.trackUri;

		if (isCurrentTrack) {
			if (isPlaying) {
				pause();
			} else {
				resume();
			}
		} else {
			playTrack(trackToSoundCloud(track));
		}
	};

	const handleDeleteTrack = async (trackId: string) => {
		if (!canEdit) {
			showError('Vous ne pouvez pas éditer cette playlist');
			return;
		}

		try {
			await removeTrack(id, trackId);
			showSuccess('Track supprimé');
		} catch (error) {
			console.error('[PlaylistDetailScreen] Remove track failed:', error);
			showError('Impossible de supprimer le track');
		}
	};

	// Rejects on failure so the list drops its local order and shows the store's again.
	const handleReorder = async (from: number, to: number) => {
		const tracks = currentPlaylist?.tracks ?? [];
		const afterRank = afterRankForDrop(tracks, from, to);
		if (afterRank === undefined) return;
		try {
			await moveTrack(id, tracks[from].id, afterRank);
		} catch (error) {
			// Conflicts are reported through conflictMessage once the playlist is reloaded.
			if (!(error instanceof ApiError && CONFLICT_CODES.includes(error.code))) {
				console.error('[PlaylistDetailScreen] Move track failed:', error);
				showError('Impossible de déplacer le track');
			}
			throw error;
		}
	};

	const isMoving = pendingMoves > 0;

	const gradientColors = dominantColor
		? ([
				hexToRgba(dominantColor, 0.9),
				hexToRgba(dominantColor, 0.6),
				hexToRgba(dominantColor, 0.3),
				theme.colors.background,
			] as const)
		: ([
				theme.colors.background,
				theme.colors.background,
				theme.colors.background,
				theme.colors.background,
			] as const);

	if (isLoading && !currentPlaylist) {
		return <LoadingSpinner fullScreen message="Chargement..." />;
	}

	if (!currentPlaylist) {
		return <LoadingSpinner fullScreen message="Chargement..." />;
	}

	return (
		<View style={styles.container}>
			{/* Full screen gradient background */}
			<LinearGradient
				colors={gradientColors as unknown as [string, string, ...string[]]}
				locations={[0, 0.25, 0.5, 0.8]}
				style={styles.gradientBackground}
			/>

			{/* Content */}
			<ReorderableList
				data={currentPlaylist.tracks}
				keyExtractor={item => item.id}
				onReorder={handleReorder}
				dragEnabled={canEdit && !isMoving}
				renderItem={({ item, drag, isActive }) => (
					<SwipeableTrackItem
						track={item}
						onDelete={() => handleDeleteTrack(item.id)}
						disabled={!canEdit}
						onAddToQueue={() => addToQueue(toTrackInput(item))}
						onDragStart={canEdit ? drag : undefined}
						isDragActive={isActive}
					/>
				)}
				ListHeaderComponent={
					<PlaylistHeader
						playlist={currentPlaylist}
						canEdit={canEdit}
						onAddTrack={handleAddTrack}
					/>
				}
				contentContainerStyle={[styles.list, { paddingBottom: playerHeight + theme.spacing.xxl }]}
				ListEmptyComponent={
					<EmptyState
						icon="musical-notes-outline"
						message="No track in this playlist. Add tracks to get started!"
					/>
				}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
}

const createStyles = (theme: Theme, topInset: number) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		gradientBackground: {
			position: 'absolute',
			top: 0,
			left: 0,
			right: 0,
			height: 450, // Gradient covers top portion
		},
		list: {
			flexGrow: 1,
			paddingTop: topInset + 60, // Space for floating header
			paddingBottom: theme.spacing.xxl,
		},
	});
