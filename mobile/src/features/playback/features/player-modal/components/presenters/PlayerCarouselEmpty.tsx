import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { PlayerCarouselCaption } from '@/features/playback/features/player-modal/components/presenters/PlayerCarouselCaption';
import { createCarouselStyles } from '@/features/playback/features/player-modal/lib/createCarouselStyles';
import { boxSize, boxWidth } from '@/features/playback/features/player-modal/lib/dynamicStyles';
import type { PlayerColors } from '@/features/playback/features/player-modal/playerModalTypes';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type PlayerCarouselEmptyProps = {
	size: number;
	colors: Pick<PlayerColors, 'text' | 'textSecondary'>;
};

export function PlayerCarouselEmpty({ size, colors }: PlayerCarouselEmptyProps) {
	const { styles } = useThemedStyles(createCarouselStyles);

	return (
		<View style={styles.artworkWrapper}>
			<View style={styles.artworkShadow}>
				<View style={[styles.artwork, styles.emptyArtwork, boxSize(size)]}>
					<PixelIcon icon={MusicSolid} size={64} color={colors.textSecondary} />
				</View>
			</View>
			<View style={[styles.slotText, boxWidth(size)]}>
				<PlayerCarouselCaption
					title="Rien en lecture"
					artist="Choisissez un titre pour commencer"
					colors={colors}
				/>
			</View>
		</View>
	);
}
