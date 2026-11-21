import { StyleSheet } from 'react-native';
import {
	SLIDER_HEIGHT,
	SLIDER_TIME_OFFSET,
} from '@/features/playback/features/player-modal/playerModalConfig';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function createSliderStyles(theme: Theme) {
	const styles = StyleSheet.create({
		progressContainer: {
			paddingHorizontal: theme.spacing.lg,
			marginBottom: theme.spacing.lg,
		},
		slider: { width: '100%', height: SLIDER_HEIGHT },
		timeContainer: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			marginTop: SLIDER_TIME_OFFSET,
		},
		timeText: {
			fontSize: theme.typography.sizes.sm,
			fontFamily: theme.typography.families.mono,
		},
	});
	return styles;
}
