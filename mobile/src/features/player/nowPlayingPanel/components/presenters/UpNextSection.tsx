import React from 'react';
import { View } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { Text } from '@/shared/components/ui/Text';
import type { QueueItem } from '@/shared/types/playback';
import { UpNextRow } from './UpNextRow';
import type { NowPlayingPanelStyles } from './nowPlayingPanelStyles';

interface UpNextSectionProps {
	items: QueueItem[];
	total: number;
	styles: NowPlayingPanelStyles;
	onPlay: (itemId: string) => void;
	onOpenQueue: () => void;
}

/** The first items of the queue; the queue sheet reorders and removes them. */
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
