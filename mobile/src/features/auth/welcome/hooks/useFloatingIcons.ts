import { useEffect, useMemo } from 'react';
import { Animated, Dimensions, Easing } from 'react-native';

export interface FloatingIconSpec {
	size: number;
	top: number;
	left: number;
	delay: number;
	duration: number;
	rotateDirection: 1 | -1;
	floatRange: number;
}

export interface FloatingIconMotion {
	spec: FloatingIconSpec;
	translateY: Animated.AnimatedInterpolation<number>;
	rotate: Animated.AnimatedInterpolation<string>;
	scale: Animated.Value;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** The four app icons floating behind the welcome screen. */
const ICONS: FloatingIconSpec[] = [
	{ size: 80, top: 60, left: 20, delay: 0, duration: 1200, rotateDirection: 1, floatRange: 35 },
	{
		size: 65,
		top: 120,
		left: SCREEN_WIDTH - 100,
		delay: 400,
		duration: 1400,
		rotateDirection: -1,
		floatRange: 30,
	},
	{
		size: 70,
		top: SCREEN_HEIGHT * 0.45,
		left: 15,
		delay: 200,
		duration: 1100,
		rotateDirection: 1,
		floatRange: 40,
	},
	{
		size: 75,
		top: SCREEN_HEIGHT * 0.55,
		left: SCREEN_WIDTH - 95,
		delay: 600,
		duration: 1300,
		rotateDirection: -1,
		floatRange: 32,
	},
];

const timing = (value: Animated.Value, toValue: number, duration: number, delay = 0) =>
	Animated.timing(value, {
		toValue,
		duration,
		delay,
		easing: Easing.inOut(Easing.sin),
		useNativeDriver: true,
	});

/** Starts the loops of one icon: float up and down, spin, pulse. */
function startLoops(
	spec: FloatingIconSpec,
	float: Animated.Value,
	spin: Animated.Value,
	scale: Animated.Value
) {
	const { duration, delay } = spec;
	Animated.loop(
		Animated.sequence([timing(float, 1, duration, delay), timing(float, 0, duration)])
	).start();
	Animated.loop(
		Animated.timing(spin, {
			toValue: 1,
			duration: duration * 2.5,
			easing: Easing.linear,
			useNativeDriver: true,
		})
	).start();
	const pulse = (toValue: number) =>
		Animated.timing(scale, {
			toValue,
			duration: duration * 1.5,
			easing: Easing.inOut(Easing.ease),
			useNativeDriver: true,
		});
	Animated.loop(Animated.sequence([pulse(1.15), pulse(1)])).start();
}

/** The motion of each floating icon, its loops started on mount. */
export function useFloatingIcons(): FloatingIconMotion[] {
	const values = useMemo(
		() =>
			ICONS.map(spec => ({
				spec,
				float: new Animated.Value(0),
				spin: new Animated.Value(0),
				scale: new Animated.Value(1),
			})),
		[]
	);

	useEffect(() => {
		values.forEach(({ spec, float, spin, scale }) => startLoops(spec, float, spin, scale));
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
