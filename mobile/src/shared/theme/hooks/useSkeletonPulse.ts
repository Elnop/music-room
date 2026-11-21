import { useEffect, useMemo } from 'react';
import { Animated, Easing } from 'react-native';
import { useReduceMotion } from '@/shared/theme/hooks/useReduceMotion';

const PULSE_MS = 800;

function fadeTo(opacity: Animated.Value, toValue: number) {
	return Animated.timing(opacity, {
		toValue,
		duration: PULSE_MS,
		easing: Easing.inOut(Easing.ease),
		useNativeDriver: true,
	});
}

export function useSkeletonPulse(): Animated.Value {
	const reduceMotion = useReduceMotion();
	const opacity = useMemo(() => new Animated.Value(1), []);

	useEffect(() => {
		if (reduceMotion !== false) {
			opacity.setValue(1);
			return undefined;
		}
		const pulse = Animated.loop(Animated.sequence([fadeTo(opacity, 0.4), fadeTo(opacity, 1)]));
		pulse.start();
		return () => pulse.stop();
	}, [reduceMotion, opacity]);

	return opacity;
}
