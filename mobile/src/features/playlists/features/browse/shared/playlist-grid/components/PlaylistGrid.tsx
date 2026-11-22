import React from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Playlist } from '@/features/playlists/shared/playlist/playlistTypes';
import { createGridStyles } from '@/features/playlists/features/browse/shared/playlist-grid/lib/listStyles';
import { PlaylistGridCard } from '@/features/playlists/features/browse/shared/playlist-grid/components/PlaylistGridCard';

type PlaylistGridProps = {
	playlists: Playlist[];
	onOpen: (id: string) => void;
	onPlaylistActions?: (playlist: Playlist) => (() => void) | undefined;
};

export function PlaylistGrid({ playlists, onOpen, onPlaylistActions }: PlaylistGridProps) {
	const { styles } = useThemedStyles(createGridStyles);

	return (
		<View style={styles.grid}>
			{playlists.map((playlist) => (
				<PlaylistGridCard
					key={playlist.id}
					playlist={playlist}
					onPress={() => onOpen(playlist.id)}
					onShowActions={onPlaylistActions?.(playlist)}
				/>
			))}
		</View>
	);
}
