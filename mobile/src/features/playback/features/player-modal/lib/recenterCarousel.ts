import { withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

const TRACK_CHANGE_MS = 260;

export function recenterCarousel(center: SharedValue<number>, anchor: number): void {
	center.value =
		Math.abs(center.value - anchor) > 1.5
			? anchor
			: withTiming(anchor, { duration: TRACK_CHANGE_MS });
}
