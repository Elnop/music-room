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

interface Slot {
	key: string;
	uri: string | null;
	offset: number;
}

const slotsOf = (carousel: ArtworkCarousel, artworkUrl: string | null): Slot[] => {
	const slots: Slot[] = [];
	const used = new Set<string>();
	const add = (name: string, uri: string | null, offset: number) => {
		const key = uri && !used.has(uri) ? uri : `${name}-${uri ?? 'none'}`;
		used.add(key);
		slots.push({ key, uri, offset });
	};
	add('current', artworkUrl, 0);
	if (carousel.hasPrevious) add('previous', carousel.previousArtworkUrl, -carousel.artworkStep);
	if (carousel.hasNext) add('next', carousel.nextArtworkUrl, carousel.artworkStep);
	return slots;
};

export function PlayerArtworkCarousel({
	styles,
	carousel,
	hasTrack,
	artworkUrl,
	emptyIconColor,
}: PlayerArtworkCarouselProps) {
	if (!hasTrack) {
		return (
			<View style={styles.artworkWrapper}>
				<View style={styles.artworkShadow}>
					<View
						style={[
							styles.artwork,
							styles.emptyArtwork,
							{ width: carousel.artworkSize, height: carousel.artworkSize },
						]}
					>
						<PixelIcon name="note" size={64} color={emptyIconColor} />
					</View>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.artworkWrapper}>
			<Animated.View style={[styles.artworkShadow, carousel.rowStyle]}>
				<View style={{ width: carousel.artworkSize, height: carousel.artworkSize }} />
				{slotsOf(carousel, artworkUrl).map(slot => (
					<View key={slot.key} style={[styles.neighbourArtwork, { left: slot.offset }]}>
						<Artwork
							uri={slot.uri}
							size={carousel.artworkSize}
							style={styles.artwork}
							iconSize={slot.offset === 0 ? 64 : undefined}
						/>
					</View>
				))}
			</Animated.View>
		</View>
	);
}
