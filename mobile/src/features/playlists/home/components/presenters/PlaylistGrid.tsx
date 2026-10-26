import React from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { Playlist } from '@/features/playlists/types';
import { createListStyles } from './listStyles';
import { PlaylistGridCard } from './PlaylistCards';

interface PlaylistGridProps {
	playlists: Playlist[];
	onOpen: (id: string) => void;
}

export function PlaylistGrid({ playlists, onOpen }: PlaylistGridProps) {
	const { styles } = useThemedStyles(createListStyles);

	return (
		<View style={styles.grid}>
			{playlists.map(playlist => (
				<PlaylistGridCard
					key={playlist.id}
					playlist={playlist}
					onPress={() => onOpen(playlist.id)}
				/>
			))}
		</View>
	);
}
