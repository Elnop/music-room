import { StyleSheet } from 'react-native';
import type { Theme } from '@/shared/theme/types/themeTypes';

const TIME_WIDTH = 44;

export function playerBarSliderStyles(theme: Theme) {
	const styles = StyleSheet.create({
		progressContainer: { justifyContent: 'center' },
		slider: { height: theme.controls.slider, marginHorizontal: TIME_WIDTH },
		timeContainer: {
			...StyleSheet.absoluteFillObject,
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			pointerEvents: 'none',
		},
		timeText: {
			width: TIME_WIDTH,
			textAlign: 'center',
			fontSize: theme.typography.sizes.sm,
			fontVariant: ['tabular-nums'],
		},
	});
	return styles;
}
