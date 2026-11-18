import { useEffect } from 'react';
import {
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated';

const FADE_MS = 400;

export function useColorFade(color: string) {
	const from = useSharedValue(color);
	const to = useSharedValue(color);
	const progress = useSharedValue(1);

	useEffect(() => {
		from.value = interpolateColor(progress.value, [0, 1], [from.value, to.value]);
		to.value = color;
		progress.value = 0;
		progress.value = withTiming(1, { duration: FADE_MS });
	}, [color, from, to, progress]);

	return useAnimatedStyle(() => ({
		backgroundColor: interpolateColor(progress.value, [0, 1], [from.value, to.value]),
	}));
}
