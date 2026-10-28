import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useContextMenu } from '@/shared/hooks/useContextMenu';
import { useGridTileWidth } from '@/shared/hooks/useGridTileWidth';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Playlist } from '@/features/playlists/types';
import { playlistCardLabel } from '@/features/playlists/home/utils/playlistLabels';
import { PlaylistCassette } from './PlaylistCassette';

interface PlaylistGridCardProps {
	playlist: Playlist;
	onPress: () => void;
	/** Web: a right click or the Menu key opens the playlist's menu. */
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
