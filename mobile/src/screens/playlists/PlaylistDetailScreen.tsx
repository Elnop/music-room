import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, RefreshControl, Alert } from 'react-native';
import { showError, showInfo, showSuccess } from '@/shared/utils/toast';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/shared/theme/ThemeContext';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import { useImageColors, hexToRgba } from '@/hooks/useImageColors';
import type { Theme } from '@/shared/theme/types';
import { CONFLICT_CODES, usePlaylistStore } from '@/store/playlistStore';
import { afterRankForDrop } from '@/store/moveTarget';
import { ApiError } from '@/shared/services/api';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { useActiveQueue, useQueueStore } from '@/store/queueStore';
import { usePlayerStore } from '@/store/playerStore';
import { selectPlaysPlaylist } from '@/store/queueSelectors';
import { toTrackInput } from '@/shared/utils/trackInput';
import { canEditPlaylist } from '@/utils/playlistPermissions';
import { usePlaylistSocket } from '@/hooks/usePlaylistSocket';
import { PlaylistHeader } from '@/components/playlist/PlaylistHeader';
import { SwipeableTrackItem } from '@/shared/components/lists/SwipeableTrackItem';
import { TrackActionsSheet } from '@/components/track/TrackActionsSheet';
import { PlaylistActionsSheet } from '@/components/playlist/PlaylistActionsSheet';
import type { AddQueueItemBody } from '@/types/queue.types';
import { ReorderableList } from '@/shared/components/lists/ReorderableList';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SkeletonBlock, SkeletonList, TrackRowSkeleton } from '@/shared/components/ui/Skeleton';
import { Button } from '@/shared/components/ui/Button';
import { logger } from '@/shared/utils/logger';

type PlaylistStackParamList = {
	Playlists: undefined;
	PlaylistDetail: { id: string };
	CreatePlaylist: { playlistId?: string } | undefined;
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
	// The track playing now, when it plays from this playlist's queue block (#307).
	const queueItemId = usePlayerStore(state => state.queueItemId);
	const playingUri = usePlayerStore(state => state.currentTrack?.permalink_url ?? null);
	const playsThisPlaylist = selectPlaysPlaylist(useActiveQueue(), queueItemId, id);
	const currentUri = playsThisPlaylist ? playingUri : null;
	const [actionTrack, setActionTrack] = React.useState<AddQueueItemBody | null>(null);
	const [playlistActionsVisible, setPlaylistActionsVisible] = React.useState(false);
	// Set while this screen deletes the playlist: its own playlist:deleted is not news.
	const deletingRef = React.useRef(false);
	const {
		currentPlaylist,
		isLoading,
		fetchPlaylistById,
		removeTrack,
		moveTrack,
		pendingMoves,
		conflictMessage,
		clearConflictMessage,
		deletePlaylist,
	} = usePlaylistStore();

	const coverUrl = currentPlaylist?.coverUrl || currentPlaylist?.tracks[0]?.albumArt;
	const { dominantColor } = useImageColors(coverUrl, theme.colors.primary);

	const isOwner = !!user && currentPlaylist?.ownerId === user.id;

	const canEdit = canEditPlaylist(user?.id, currentPlaylist);

	const { deleted } = usePlaylistSocket(id);

	// Deleted by its owner while on screen (#342): tell the user and leave.
	React.useEffect(() => {
		if (!deleted || deletingRef.current) return;
		showInfo('Cette playlist a été supprimée');
		// Root of its stack (opened from a link): go to the list rather than stay stuck.
		if (navigation.canGoBack()) navigation.goBack();
		else navigation.navigate('Playlists');
	}, [deleted, navigation]);

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

	const openPlaylistActions = useCallback(() => setPlaylistActionsVisible(true), []);

	const handleEdit = () => {
		navigation.navigate('CreatePlaylist', { playlistId: id });
	};

	const handleSharing = () => {
		navigation.navigate('PlaylistSharing', { playlistId: id });
	};

	const confirmDelete = async () => {
		deletingRef.current = true;
		try {
			await deletePlaylist(id);
			showSuccess('Playlist supprimée');
			navigation.popToTop();
		} catch (error) {
			deletingRef.current = false;
			logger.error('[PlaylistDetailScreen] Delete playlist failed:', error);
			showError(apiErrorMessage(error, 'Impossible de supprimer la playlist'));
		}
	};

	const handleDelete = () => {
		Alert.alert(
			'Supprimer la playlist ?',
			`« ${currentPlaylist?.name ?? ''} » sera supprimée pour tous ses membres. Cette action est définitive.`,
			[
				{ text: 'Annuler', style: 'cancel' },
				{ text: 'Supprimer', style: 'destructive', onPress: () => void confirmDelete() },
			]
		);
	};

	// Configure header natif transparent avec bouton d'options. headerRight is
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
							onPress={openPlaylistActions}
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
	}, [navigation, isOwner, openPlaylistActions, theme.colors.text, styles.headerButton]);

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
			showSuccess('Titre supprimé');
		} catch (error) {
			logger.error('[PlaylistDetailScreen] Remove track failed:', error);
			showError(apiErrorMessage(error, 'Impossible de supprimer le titre'));
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
				logger.error('[PlaylistDetailScreen] Move track failed:', error);
				showError(apiErrorMessage(error, 'Impossible de déplacer le titre'));
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
				// Rows re-render when the playing track changes, to move the highlight.
				extraData={currentUri}
				renderItem={({ item, drag, isActive }) => (
					<SwipeableTrackItem
						track={item}
						onDelete={() => handleDeleteTrack(item.id)}
						disabled={!canEdit}
						onAddToQueue={() => addToQueue(toTrackInput(item))}
						onShowActions={() => setActionTrack(toTrackInput(item))}
						onDragStart={canEdit ? drag : undefined}
						isDragActive={isActive}
						isCurrent={currentUri !== null && item.trackUri === currentUri}
					/>
				)}
				ListHeaderComponent={
					<PlaylistHeader
						playlist={currentPlaylist}
						canEdit={canEdit}
						onAddTrack={handleAddTrack}
					/>
				}
				// The last track scrolls clear of the mini player.
				contentContainerStyle={[styles.list, { paddingBottom: playerHeight + theme.spacing.md }]}
				ListEmptyComponent={
					<EmptyState
						icon="musical-notes-outline"
						message="Aucun titre dans cette playlist pour l'instant"
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

			<TrackActionsSheet track={actionTrack} onClose={() => setActionTrack(null)} />
			{isOwner && (
				<PlaylistActionsSheet
					visible={playlistActionsVisible}
					playlistName={currentPlaylist.name}
					onClose={() => setPlaylistActionsVisible(false)}
					onEdit={handleEdit}
					onSharing={handleSharing}
					onDelete={handleDelete}
				/>
			)}
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
