import React from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Playlist } from '@/features/playlists/shared/playlist/lib/types';
import { createListStyles } from '@/features/playlists/features/browse/shared/playlist-grid/lib/listStyles';
import { PlaylistGridCard } from './PlaylistCards';

interface PlaylistGridProps {
	playlists: Playlist[];
	onOpen: (id: string) => void;
	actionsFor?: (playlist: Playlist) => (() => void) | undefined;
}

export function PlaylistGrid({ playlists, onOpen, actionsFor }: PlaylistGridProps) {
	const { styles } = useThemedStyles(createListStyles);

	return (
		<View style={styles.grid}>
			{playlists.map(playlist => (
				<PlaylistGridCard
					key={playlist.id}
					playlist={playlist}
					onPress={() => onOpen(playlist.id)}
					onShowActions={actionsFor?.(playlist)}
				/>
			))}
		</View>
	);
}
