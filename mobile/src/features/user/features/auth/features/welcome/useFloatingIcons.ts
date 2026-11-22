import { useEffect, useMemo } from 'react';
import { Animated } from 'react-native';
import { FLOATING_ICONS } from '@/features/user/features/auth/features/welcome/floatingIconsConfig';
import { startFloatingLoops } from '@/features/user/features/auth/features/welcome/startFloatingLoops';
import type { FloatingIconMotion } from '@/features/user/features/auth/features/welcome/welcomeTypes';

export function useFloatingIcons(): FloatingIconMotion[] {
	const values = useMemo(
		() =>
			FLOATING_ICONS.map((spec) => ({
				spec,
				float: new Animated.Value(0),
				spin: new Animated.Value(0),
				scale: new Animated.Value(1),
			})),
		[],
	);

	useEffect(() => {
		for (const value of values) startFloatingLoops(value);
	}, [values]);

	return values.map(({ spec, float, spin, scale }) => ({
		spec,
		translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -spec.floatRange] }),
		rotate: spin.interpolate({
			inputRange: [0, 1],
			outputRange: ['0deg', `${spec.rotateDirection * 360}deg`],
		}),
		scale,
	}));
}
