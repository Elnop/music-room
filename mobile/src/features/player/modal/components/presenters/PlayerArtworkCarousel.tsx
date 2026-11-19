import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import { Text } from '@/shared/components/ui/Text';
import type { ArtworkCarousel } from '@/features/player/modal/hooks/useArtworkCarousel';
import { CAROUSEL_TEXT_HEIGHT, type createStyles } from './playerModalStyles';
import { PlayerCarouselSlot } from './PlayerCarouselSlot';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

interface PlayerArtworkCarouselProps {
	styles: ReturnType<typeof createStyles>;
	carousel: ArtworkCarousel;
	colors: { text: string; textSecondary: string };
}

export function PlayerArtworkCarousel({ styles, carousel, colors }: PlayerArtworkCarouselProps) {
	const size = carousel.artworkSize;
	const frameSize = size + styles.artworkShadow.borderWidth * 2;

	if (carousel.slots.length === 0) {
		return (
			<View style={styles.artworkWrapper}>
				<View style={styles.artworkShadow}>
					<View style={[styles.artwork, styles.emptyArtwork, { width: size, height: size }]}>
						<PixelIcon icon={MusicSolid} size={64} color={colors.textSecondary} />
					</View>
				</View>
				<View style={[styles.slotText, { width: size }]}>
					<View style={styles.titleBox}>
						<Text style={[styles.title, { color: colors.text }]}>Rien en lecture</Text>
					</View>
					<Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
						Choisissez un titre pour commencer
					</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.artworkWrapper}>
			<View style={{ width: frameSize, height: frameSize + CAROUSEL_TEXT_HEIGHT }}>
				{carousel.slots.map(slot => (
					<PlayerCarouselSlot
						key={slot.key}
						styles={styles}
						slot={slot}
						center={carousel.center}
						drag={carousel.drag}
						size={size}
						step={carousel.artworkStep}
						colors={colors}
					/>
				))}
			</View>
		</View>
	);
}
