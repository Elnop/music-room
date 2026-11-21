import React from 'react';
import { View } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import type { QueueItem } from '@/shared/playback/types/playbackTypes';
import { UpNextRow } from '@/features/playback/features/now-playing-panel/components/presenters/UpNextRow';
import type { NowPlayingPanelStyles } from '@/features/playback/features/now-playing-panel/components/presenters/nowPlayingPanelStyles';

type UpNextSectionProps = {
	items: QueueItem[];
	total: number;
	styles: NowPlayingPanelStyles;
	onPlay: (itemId: string) => void;
	onOpenQueue: () => void;
};

export function UpNextSection({ items, total, styles, onPlay, onOpenQueue }: UpNextSectionProps) {
	return (
		<View style={styles.card}>
			<View style={styles.cardHeader}>
				<Text style={styles.cardTitle} accessibilityRole="header">
					Suivant dans la file
				</Text>
				<Pressable onPress={onOpenQueue} accessibilityLabel="Afficher toute la file d'attente">
					<Text style={styles.link}>
						{total > items.length ? `Tout afficher (${total})` : 'Ouvrir la file'}
					</Text>
				</Pressable>
			</View>
			{items.length === 0 ? (
				<Text style={styles.caption}>Rien d&apos;autre dans la file après ce titre.</Text>
			) : (
				items.map(item => <UpNextRow key={item.id} item={item} styles={styles} onPlay={onPlay} />)
			)}
		</View>
	);
}
