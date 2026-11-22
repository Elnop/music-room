import { Animated, Easing } from 'react-native';
import type { FloatingIconValues } from '@/features/user/features/auth/features/welcome/welcomeTypes';

function timing(value: Animated.Value, toValue: number, duration: number, delay = 0) {
	return Animated.timing(value, {
		toValue,
		duration,
		delay,
		easing: Easing.inOut(Easing.sin),
		useNativeDriver: true,
	});
}

function pulse(scale: Animated.Value, toValue: number, duration: number) {
	return Animated.timing(scale, {
		toValue,
		duration: duration * 1.5,
		easing: Easing.inOut(Easing.ease),
		useNativeDriver: true,
	});
}

export function startFloatingLoops({ spec, float, spin, scale }: FloatingIconValues): void {
	const { duration, delay } = spec;
	Animated.loop(
		Animated.sequence([timing(float, 1, duration, delay), timing(float, 0, duration)]),
	).start();
	Animated.loop(
		Animated.timing(spin, {
			toValue: 1,
			duration: duration * 2.5,
			easing: Easing.linear,
			useNativeDriver: true,
		}),
	).start();
	Animated.loop(
		Animated.sequence([pulse(scale, 1.15, duration), pulse(scale, 1, duration)]),
	).start();
}
