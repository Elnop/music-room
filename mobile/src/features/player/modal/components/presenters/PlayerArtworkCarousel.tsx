import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { Artwork } from '@/shared/components/media/Artwork';
import type { ArtworkCarousel } from '@/features/player/modal/hooks/useArtworkCarousel';
import { ARTWORK_SIZE, ARTWORK_STEP, type createStyles } from './playerModalStyles';

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
					<View style={[styles.neighbourArtwork, { left: -ARTWORK_STEP }]}>
						<Artwork uri={carousel.previousArtworkUrl} size={ARTWORK_SIZE} style={styles.artwork} />
					</View>
				)}
				{hasTrack ? (
					<Artwork uri={artworkUrl} size={ARTWORK_SIZE} style={styles.artwork} iconSize={64} />
				) : (
					<View style={[styles.artwork, styles.emptyArtwork]}>
						<Ionicons name="musical-notes" size={64} color={emptyIconColor} />
					</View>
				)}
				{carousel.hasNext && (
					<View style={[styles.neighbourArtwork, { left: ARTWORK_STEP }]}>
						<Artwork uri={carousel.nextArtworkUrl} size={ARTWORK_SIZE} style={styles.artwork} />
					</View>
				)}
			</Animated.View>
		</View>
	);
}
