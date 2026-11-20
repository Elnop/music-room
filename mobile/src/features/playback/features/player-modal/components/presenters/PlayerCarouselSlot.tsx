import React from 'react';
import { View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Artwork } from '@/shared/theme/components/Artwork';
import { Text } from '@/shared/theme/components/Text';
import type { CarouselSlot } from '@/features/playback/features/player-modal/hooks/useArtworkCarousel';
import type { createStyles } from './playerModalStyles';

interface PlayerCarouselSlotProps {
	styles: ReturnType<typeof createStyles>;
	slot: CarouselSlot;
	center: SharedValue<number>;
	drag: SharedValue<number>;
	size: number;
	step: number;
	colors: { text: string; textSecondary: string };
}

export function PlayerCarouselSlot({
	styles,
	slot,
	center,
	drag,
	size,
	step,
	colors,
}: PlayerCarouselSlotProps) {
	const position = useAnimatedStyle(() => ({
		transform: [{ translateX: (slot.index - center.value) * step + drag.value }],
	}));
	const textFade = useAnimatedStyle(() => {
		const distance = Math.abs(slot.index - center.value + drag.value / step);
		return { opacity: interpolate(distance, [0, 0.6], [1, 0], 'clamp') };
	});

	return (
		<Animated.View
			style={[styles.slot, { width: size + styles.artworkShadow.borderWidth * 2 }, position]}
		>
			<View style={styles.artworkShadow}>
				<Artwork uri={slot.uri} size={size} style={styles.artwork} iconSize={64} />
			</View>
			<Animated.View style={[styles.slotText, textFade]}>
				<View style={styles.titleBox}>
					<Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
						{slot.title}
					</Text>
				</View>
				<Text style={[styles.artist, { color: colors.textSecondary }]} numberOfLines={1}>
					{slot.artist}
				</Text>
			</Animated.View>
		</Animated.View>
	);
}
