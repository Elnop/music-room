import React from 'react';
import { View } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { Artwork } from '@/shared/theme/components/Artwork';
import type { QueueItem } from '@/shared/playback/lib/playback';
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
			<Artwork uri={track.albumArt} size={UP_NEXT_ARTWORK_SIZE} />
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
