import { useEffect, useState } from 'react';
import { Animated, Easing } from 'react-native';

/** A value that runs from 0 to 1 again and again while `running`, and holds still otherwise. */
export function useLoop(running: boolean, durationMs: number): Animated.Value {
	const [progress] = useState(() => new Animated.Value(0));

	useEffect(() => {
		if (!running) return;
		const loop = Animated.loop(
			Animated.timing(progress, {
				toValue: 1,
				duration: durationMs,
				easing: Easing.linear,
				useNativeDriver: true,
			})
		);
		loop.start();
		return () => loop.stop();
	}, [running, durationMs, progress]);

	return progress;
}
