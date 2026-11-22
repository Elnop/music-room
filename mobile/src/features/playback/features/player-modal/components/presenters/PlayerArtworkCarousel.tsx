import React from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { PlayerCarouselSlot } from '@/features/playback/features/player-modal/components/presenters/PlayerCarouselSlot';
import { PlayerCarouselEmpty } from '@/features/playback/features/player-modal/components/presenters/PlayerCarouselEmpty';
import { createCarouselStyles } from '@/features/playback/features/player-modal/lib/createCarouselStyles';
import { boxSize } from '@/features/playback/features/player-modal/lib/dynamicStyles';
import { CAROUSEL_TEXT_HEIGHT } from '@/features/playback/features/player-modal/playerModalConfig';
import type {
	ArtworkCarousel,
	PlayerColors,
} from '@/features/playback/features/player-modal/playerModalTypes';

type PlayerArtworkCarouselProps = {
	carousel: ArtworkCarousel;
	colors: Pick<PlayerColors, 'text' | 'textSecondary'>;
};

export function PlayerArtworkCarousel({ carousel, colors }: PlayerArtworkCarouselProps) {
	const { styles, theme } = useThemedStyles(createCarouselStyles);
	const size = carousel.artworkSize;
	const frameSize = size + theme.borders.thick * 2;
	const motion = { center: carousel.center, drag: carousel.drag, step: carousel.artworkStep };

	if (carousel.slots.length === 0) return <PlayerCarouselEmpty size={size} colors={colors} />;

	return (
		<View style={styles.artworkWrapper}>
			<View style={boxSize(frameSize, frameSize + CAROUSEL_TEXT_HEIGHT)}>
				{carousel.slots.map((slot) => (
					<PlayerCarouselSlot
						key={slot.key}
						slot={slot}
						motion={motion}
						size={size}
						colors={colors}
					/>
				))}
			</View>
		</View>
	);
}
