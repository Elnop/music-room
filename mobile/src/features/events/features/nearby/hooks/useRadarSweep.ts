import { useLoop } from '@/shared/theme/hooks/useLoop';

export function useRadarSweep() {
	const sweep = useLoop(true, 4000);
	const ping = useLoop(true, 1600);
	return {
		armStyle: {
			transform: [
				{
					rotate: sweep.interpolate({
						inputRange: [0, 0.5, 1],
						outputRange: ['-80deg', '80deg', '-80deg'],
					}),
				},
			],
		},
		pingStyle: {
			opacity: ping.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
			transform: [{ scale: ping.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
		},
	};
}
