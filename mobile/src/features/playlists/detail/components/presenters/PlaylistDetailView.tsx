import React from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ReorderableList } from '@/shared/components/lists/ReorderableList';
import { SwipeableTrackItem } from '@/shared/components/lists/SwipeableTrackItem';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { PlaylistTracks } from '@/features/playlists/detail/hooks/usePlaylistTracks';
import type { PlaylistWithTracks } from '@/features/playlists/types';
import { createDetailStyles } from './detailStyles';

interface PlaylistDetailViewProps {
	playlist: PlaylistWithTracks;
	tracks: PlaylistTracks;
	header: React.ReactElement;
	gradient: readonly [string, string, ...string[]];
	isRefreshing: boolean;
	onRefresh: () => void;
	bottomPadding: number;
	onPlayTrack: (track: { id: string; trackUri: string }) => void;
	pendingTrackId: string | null;
}

export function PlaylistDetailView({
	playlist,
	tracks,
	header,
	gradient,
	isRefreshing,
	onRefresh,
	bottomPadding,
	onPlayTrack,
	pendingTrackId,
}: PlaylistDetailViewProps) {
	const { theme } = useTheme();
	const insets = useSafeAreaInsets();
	const styles = React.useMemo(() => createDetailStyles(theme, insets.top), [theme, insets.top]);
	const { canEdit, currentUri } = tracks;

	return (
		<View style={styles.container}>
			<LinearGradient
				colors={gradient}
				locations={[0, 0.25, 0.5, 0.8]}
				style={gradientStyles.background}
			/>
			<ReorderableList
				data={playlist.tracks}
				keyExtractor={item => item.id}
				onReorder={tracks.reorder}
				dragEnabled={canEdit && !tracks.isMoving}
				// Rows re-render when the playing track changes, to move the highlight.
				extraData={currentUri}
				renderItem={({ item, drag, isActive }) => (
					<SwipeableTrackItem
						track={item}
						onDelete={() => tracks.deleteTrack(item.id)}
						disabled={!canEdit}
						onAddToQueue={() => tracks.addToQueue(item)}
						onShowActions={() => tracks.showActions(item)}
						onDragStart={canEdit ? drag : undefined}
						isDragActive={isActive}
						isCurrent={currentUri !== null && item.trackUri === currentUri}
						onPress={() => onPlayTrack(item)}
						isPending={pendingTrackId === item.id}
					/>
				)}
				ListHeaderComponent={header}
				// The last track scrolls clear of the mini player.
				contentContainerStyle={[styles.list, { paddingBottom: bottomPadding }]}
				ListEmptyComponent={
					<EmptyState
						icon="musical-notes-outline"
						message="Aucun titre dans cette playlist pour l'instant"
					/>
				}
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={onRefresh}
						tintColor={theme.colors.primary}
						colors={[theme.colors.primary]}
					/>
				}
				showsVerticalScrollIndicator={false}
			/>
		</View>
	);
}

const gradientStyles = StyleSheet.create({
	background: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		height: 450, // The gradient covers the top of the screen
	},
});
