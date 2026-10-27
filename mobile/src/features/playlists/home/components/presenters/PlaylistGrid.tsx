import React from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Playlist } from '@/features/playlists/types';
import { createListStyles } from './listStyles';
import { PlaylistGridCard } from './PlaylistCards';

interface PlaylistGridProps {
	playlists: Playlist[];
	onOpen: (id: string) => void;
	/** The menu of a card; none for a playlist without one. */
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
