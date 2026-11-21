import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Artwork } from '@/shared/theme/components/Artwork';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { PlayerCarouselCaption } from '@/features/playback/features/player-modal/components/presenters/PlayerCarouselCaption';
import { useCarouselSlotMotion } from '@/features/playback/features/player-modal/hooks/useCarouselSlotMotion';
import { createCarouselStyles } from '@/features/playback/features/player-modal/lib/createCarouselStyles';
import { boxWidth } from '@/features/playback/features/player-modal/lib/dynamicStyles';
import type {
	CarouselMotion,
	CarouselSlot,
	PlayerColors,
} from '@/features/playback/features/player-modal/playerModalTypes';

type PlayerCarouselSlotProps = {
	slot: CarouselSlot;
	motion: CarouselMotion;
	size: number;
	colors: Pick<PlayerColors, 'text' | 'textSecondary'>;
};

export function PlayerCarouselSlot({ slot, motion, size, colors }: PlayerCarouselSlotProps) {
	const { styles, theme } = useThemedStyles(createCarouselStyles);
	const { position, textFade } = useCarouselSlotMotion(slot.index, motion);

	return (
		<Animated.View style={[styles.slot, boxWidth(size + theme.borders.thick * 2), position]}>
			<View style={styles.artworkShadow}>
				<Artwork uri={slot.uri} size={size} style={styles.artwork} iconSize={64} />
			</View>
			<Animated.View style={[styles.slotText, textFade]}>
				<PlayerCarouselCaption
					title={slot.title}
					artist={slot.artist}
					colors={colors}
					titleLines={2}
				/>
			</Animated.View>
		</Animated.View>
	);
}
