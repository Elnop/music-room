import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { QueueItem } from '@/shared/playback/types/playbackTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { PanelCard } from '@/features/playback/features/now-playing-panel/components/presenters/PanelCard';
import { UpNextRow } from '@/features/playback/features/now-playing-panel/components/presenters/UpNextRow';

type UpNextSectionProps = {
	items: QueueItem[];
	total: number;
	onPlay: (itemId: string) => void;
	onOpenQueue: () => void;
};

export function UpNextSection({ items, total, onPlay, onOpenQueue }: UpNextSectionProps) {
	const { styles } = useThemedStyles(createStyles);
	const link = {
		label: total > items.length ? `Tout afficher (${total})` : 'Ouvrir la file',
		accessibilityLabel: "Afficher toute la file d'attente",
		onPress: onOpenQueue,
	};

	return (
		<PanelCard title="Suivant dans la file" link={link}>
			{items.length === 0 ? (
				<Text style={styles.caption}>Rien d&apos;autre dans la file après ce titre.</Text>
			) : (
				items.map((item) => <UpNextRow key={item.id} item={item} onPlay={onPlay} />)
			)}
		</PanelCard>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		caption: { fontSize: theme.typography.sizes.sm, color: theme.colors.textSecondary },
	});
	return styles;
}
