import React from 'react';
import { View } from 'react-native';
import { PixelIcon } from '@/shared/components/media/PixelIcon';
import Animated from 'react-native-reanimated';
import { Artwork } from '@/shared/components/media/Artwork';
import type { ArtworkCarousel } from '@/features/player/modal/hooks/useArtworkCarousel';
import type { createStyles } from './playerModalStyles';

interface PlayerArtworkCarouselProps {
	styles: ReturnType<typeof createStyles>;
	carousel: ArtworkCarousel;
	hasTrack: boolean;
	artworkUrl: string | null;
	emptyIconColor: string;
}

export function PlayerArtworkCarousel({
	styles,
	carousel,
	hasTrack,
	artworkUrl,
	emptyIconColor,
}: PlayerArtworkCarouselProps) {
	return (
		<View style={styles.artworkWrapper}>
			<Animated.View style={[styles.artworkShadow, carousel.rowStyle]}>
				{carousel.hasPrevious && (
					<View style={[styles.neighbourArtwork, { left: -carousel.artworkStep }]}>
						<Artwork
							uri={carousel.previousArtworkUrl}
							size={carousel.artworkSize}
							style={styles.artwork}
						/>
					</View>
				)}
				{hasTrack ? (
					<Artwork
						uri={artworkUrl}
						size={carousel.artworkSize}
						style={styles.artwork}
						iconSize={64}
					/>
				) : (
					<View
						style={[
							styles.artwork,
							styles.emptyArtwork,
							{ width: carousel.artworkSize, height: carousel.artworkSize },
						]}
					>
						<PixelIcon name="note" size={64} color={emptyIconColor} />
					</View>
				)}
				{carousel.hasNext && (
					<View style={[styles.neighbourArtwork, { left: carousel.artworkStep }]}>
						<Artwork
							uri={carousel.nextArtworkUrl}
							size={carousel.artworkSize}
							style={styles.artwork}
						/>
					</View>
				)}
			</Animated.View>
		</View>
	);
}
