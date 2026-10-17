import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, RefreshControl } from 'react-native';
import { showError, showSuccess } from '@utils/toast';
import { apiErrorMessage } from '@utils/apiErrorMessage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useImageColors, hexToRgba } from '@/hooks/useImageColors';
import type { Theme } from '@themes/types';
import { CONFLICT_CODES, usePlaylistStore } from '@store/playlistStore';
import { afterRankForDrop } from '@store/moveTarget';
import { ApiError } from '@/services/api';
import { useAuthStore } from '@store/authStore';
import { useQueueStore } from '@store/queueStore';
import { toTrackInput } from '@utils/trackInput';
import { canEditPlaylist } from '@utils/playlistPermissions';
import { usePlaylistSocket } from '@hooks/usePlaylistSocket';
import { PlaylistHeader } from '@components/playlist/PlaylistHeader';
import {
	PLAY_PLAYLIST_BUTTON_SIZE,
	PlayPlaylistButton,
} from '@components/playlist/PlayPlaylistButton';
import { SwipeableTrackItem } from '@components/common/SwipeableTrackItem';
import { TrackActionsSheet } from '@components/track/TrackActionsSheet';
import type { AddQueueItemBody } from '@/types/queue.types';
import { ReorderableList } from '@components/common/ReorderableList';
import { EmptyState } from '@components/common/EmptyState';
import { SkeletonBlock, SkeletonList, TrackRowSkeleton } from '@components/common/Skeleton';
import { Button } from '@components/common/Button';

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
	const [actionTrack, setActionTrack] = React.useState<AddQueueItemBody | null>(null);
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

	const coverUrl = currentPlaylist?.coverUrl || currentPlaylist?.tracks[0]?.albumArt;
	const { dominantColor } = useImageColors(coverUrl, theme.colors.primary);

	const isOwner = !!user && currentPlaylist?.ownerId === user.id;

	const canEdit = canEditPlaylist(user?.id, currentPlaylist);

	usePlaylistSocket(id);

	// A move refused because someone else changed the track: the store reloaded it.
	React.useEffect(() => {
		if (!conflictMessage) return;
		showError(conflictMessage);
		clearConflictMessage();
	}, [conflictMessage, clearConflictMessage]);

	// A message left by this screen must not show on the next playlist opened.
	React.useEffect(() => () => clearConflictMessage(), [clearConflictMessage]);

	// This screen's own load failure, tied to the playlist it asked for (#321:
	// a share link may point to a private or deleted playlist).
	const [loadFailure, setLoadFailure] = React.useState<{ id: string; notFound: boolean } | null>(
		null
	);

	// Resolves to whether the playlist loaded; never rejects.
	const loadPlaylist = React.useCallback((): Promise<boolean> => {
		setLoadFailure(null);
		return fetchPlaylistById(id).then(
			() => true,
			(error: unknown) => {
				const notFound =
					error instanceof ApiError && (error.status === 403 || error.status === 404);
				setLoadFailure({ id, notFound });
				return false;
			}
		);
	}, [id, fetchPlaylistById]);

	useFocusEffect(
		React.useCallback(() => {
			loadPlaylist();
		}, [loadPlaylist])
	);

	// Pull to refresh: the tracks stay on screen while the playlist reloads.
	const [isRefreshing, setIsRefreshing] = React.useState(false);
	const handleRefresh = React.useCallback(async () => {
		setIsRefreshing(true);
		const loaded = await loadPlaylist();
		setIsRefreshing(false);
		if (!loaded) showError('Impossible de charger la playlist');
	}, [loadPlaylist]);

	const handleShare = useCallback(() => {
		navigation.navigate('PlaylistSharing', { playlistId: id });
	}, [navigation, id]);

	// Configure header natif transparent avec bouton partage. headerRight is
	// always set and keeps the same view, empty for a non-owner: isOwner turns
	// false while the playlist reloads, and adding or removing the native header
	// subview while the screen re-attaches on Android crashes with "The specified
	// child already has a parent" (#343).
	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerTransparent: true,
			headerTitle: '',
			headerRight: () => (
				<View style={styles.headerButton}>
					{isOwner ? (
						<Pressable
							onPress={handleShare}
							accessibilityRole="button"
							accessibilityLabel="Options de la playlist"
							style={styles.headerButton}
						>
							<Ionicons name="ellipsis-horizontal" size={24} color={theme.colors.text} />
						</Pressable>
					) : null}
				</View>
			),
		});
	}, [navigation, isOwner, handleShare, theme.colors.text, styles.headerButton]);

	const handleAddTrack = () => {
		navigation.navigate('SearchTracks', { playlistId: id });
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
			showError(apiErrorMessage(error, 'Impossible de supprimer le track'));
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
				showError(apiErrorMessage(error, 'Impossible de déplacer le track'));
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

	const skeleton = (
		<View style={styles.container}>
			<SkeletonList
				count={8}
				row={TrackRowSkeleton}
				style={styles.list}
				header={
					<View style={styles.headerSkeleton}>
						<SkeletonBlock width={200} height={200} radius={8} />
						<SkeletonBlock width="60%" height={24} style={styles.headerSkeletonTitle} />
						<SkeletonBlock width="40%" height={14} style={styles.headerSkeletonLine} />
					</View>
				}
			/>
		</View>
	);

	if (isLoading && !currentPlaylist) {
		return skeleton;
	}

	if (!currentPlaylist) {
		if (loadFailure?.id === id) {
			return (
				<View style={[styles.container, styles.failure]}>
					{loadFailure.notFound ? (
						<EmptyState icon="lock-closed-outline" message="Playlist introuvable ou inaccessible" />
					) : (
						<>
							<EmptyState
								icon="cloud-offline-outline"
								message="Impossible de charger la playlist"
								style={styles.failureMessage}
							/>
							<Button title="Réessayer" variant="outline" onPress={loadPlaylist} />
						</>
					)}
				</View>
			);
		}
		return skeleton;
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
						onShowActions={() => setActionTrack(toTrackInput(item))}
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
				// The last track scrolls clear of the floating Play button and the mini player.
				contentContainerStyle={[
					styles.list,
					{
						paddingBottom: playerHeight + PLAY_PLAYLIST_BUTTON_SIZE + theme.spacing.md * 2,
					},
				]}
				ListEmptyComponent={
					<EmptyState
						icon="musical-notes-outline"
						message="Aucun titre dans cette playlist pour l'instant"
						action={canEdit ? { label: 'Ajouter des titres', onPress: handleAddTrack } : undefined}
					/>
				}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={handleRefresh}
						tintColor={theme.colors.primary}
						colors={[theme.colors.primary]}
					/>
				}
				showsVerticalScrollIndicator={false}
			/>

			<PlayPlaylistButton playlistId={id} trackCount={currentPlaylist.tracks.length} />

			<TrackActionsSheet track={actionTrack} onClose={() => setActionTrack(null)} />
		</View>
	);
}

const createStyles = (theme: Theme, topInset: number) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		headerButton: {
			width: 36,
			height: 36,
			alignItems: 'center',
			justifyContent: 'center',
		},
		failure: {
			justifyContent: 'center',
			alignItems: 'center',
			padding: theme.spacing.xl,
		},
		failureMessage: {
			flex: 0,
		},
		headerSkeleton: {
			alignItems: 'center',
			paddingHorizontal: theme.spacing.md,
			marginBottom: theme.spacing.lg,
		},
		headerSkeletonTitle: {
			marginTop: theme.spacing.lg,
		},
		headerSkeletonLine: {
			marginTop: theme.spacing.sm,
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
