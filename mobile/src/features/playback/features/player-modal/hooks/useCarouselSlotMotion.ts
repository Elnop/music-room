import { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import type { CarouselMotion } from '@/features/playback/features/player-modal/playerModalTypes';

export function useCarouselSlotMotion(index: number, { center, drag, step }: CarouselMotion) {
	const position = useAnimatedStyle(() => ({
		transform: [{ translateX: (index - center.value) * step + drag.value }],
	}));
	const textFade = useAnimatedStyle(() => {
		const distance = Math.abs(index - center.value + drag.value / step);
		return { opacity: interpolate(distance, [0, 0.6], [1, 0], 'clamp') };
	});
	return { position, textFade };
}
