import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { useContextMenu } from '@/shared/theme/hooks/useContextMenu';
import { useGridTileWidth } from '@/shared/theme/hooks/useGridTileWidth';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Playlist } from '@/features/playlists/shared/playlist/lib/types';
import { playlistCardLabel } from '@/features/playlists/features/browse/shared/playlist-grid/lib/playlistLabels';
import { PlaylistCassette } from './PlaylistCassette';

interface PlaylistGridCardProps {
	playlist: Playlist;
	onPress: () => void;
	/** Web only: a right click or the Menu key. */
	onShowActions?: () => void;
}

export function PlaylistGridCard({ playlist, onPress, onShowActions }: PlaylistGridCardProps) {
	const { styles } = useThemedStyles(createStyles);
	const width = useGridTileWidth();
	const { owner } = playlist;
	const contextMenu = useContextMenu(onShowActions);

	return (
		<Pressable
			{...contextMenu}
			style={[styles.tile, { width }]}
			onPress={onPress}
			accessibilityLabel={playlistCardLabel(playlist.name, owner)}
		>
			<PlaylistCassette playlist={playlist} owner={owner} width={width} />
		</Pressable>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		tile: { marginBottom: theme.spacing.lg },
	});
