import React from 'react';
import { View } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Text } from '@/shared/components/ui/Text';
import { Artwork } from '@/shared/components/media/Artwork';
import type { QueueItem } from '@/shared/types/playback';
import { UP_NEXT_ARTWORK_SIZE, type NowPlayingPanelStyles } from './nowPlayingPanelStyles';

interface UpNextRowProps {
	item: QueueItem;
	styles: NowPlayingPanelStyles;
	onPlay: (itemId: string) => void;
}

export function UpNextRow({ item, styles, onPlay }: UpNextRowProps) {
	const { track } = item;
	return (
		<Pressable
			style={styles.row}
			onPress={() => onPlay(item.id)}
			accessibilityLabel={`Lire ${track.title}, ${track.artist}`}
		>
			<Artwork uri={track.albumArt} size={UP_NEXT_ARTWORK_SIZE} style={styles.rowArtwork} />
			<View style={styles.rowText}>
				<Text style={styles.rowTitle} numberOfLines={1}>
					{track.title}
				</Text>
				<Text style={styles.caption} numberOfLines={1}>
					{track.artist}
				</Text>
			</View>
		</Pressable>
	);
}
