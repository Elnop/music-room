import React from 'react';
import { View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { createCarouselTextStyles } from '@/features/playback/features/player-modal/lib/createCarouselTextStyles';
import { textColor } from '@/features/playback/features/player-modal/lib/dynamicStyles';
import type { PlayerColors } from '@/features/playback/features/player-modal/playerModalTypes';

type PlayerCarouselCaptionProps = {
	title: string;
	artist: string;
	colors: Pick<PlayerColors, 'text' | 'textSecondary'>;
	titleLines?: number;
};

export function PlayerCarouselCaption({
	title,
	artist,
	colors,
	titleLines,
}: PlayerCarouselCaptionProps) {
	const { styles } = useThemedStyles(createCarouselTextStyles);

	return (
		<>
			<View style={styles.titleBox}>
				<Text style={[styles.title, textColor(colors.text)]} numberOfLines={titleLines}>
					{title}
				</Text>
			</View>
			<Text style={[styles.artist, textColor(colors.textSecondary)]} numberOfLines={1}>
				{artist}
			</Text>
		</>
	);
}
