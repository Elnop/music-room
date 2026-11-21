import { StyleSheet } from 'react-native';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import {
	ARTIST_LINE_HEIGHT,
	TITLE_GAP,
	TITLE_LINE_HEIGHT,
} from '@/features/playback/features/player-modal/playerModalConfig';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function createCarouselTextStyles(theme: Theme) {
	const styles = StyleSheet.create({
		titleBox: { height: TITLE_LINE_HEIGHT * 2, justifyContent: 'center', marginBottom: TITLE_GAP },
		title: {
			...displayText(theme, 24),
			lineHeight: TITLE_LINE_HEIGHT,
			textAlign: 'center',
			textShadowColor: theme.colors.shadow,
			textShadowOffset: { width: theme.borders.thick, height: theme.borders.thick },
			textShadowRadius: 0,
		},
		artist: {
			fontSize: theme.typography.sizes.lxl,
			lineHeight: ARTIST_LINE_HEIGHT,
			fontFamily: theme.typography.families.medium,
			textAlign: 'center',
		},
	});
	return styles;
}
