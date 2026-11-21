import { StyleSheet } from 'react-native';
import { CAROUSEL_TEXT_GAP } from '@/features/playback/features/player-modal/playerModalConfig';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function createCarouselStyles(theme: Theme) {
	const styles = StyleSheet.create({
		artworkWrapper: { alignItems: 'center', marginBottom: theme.spacing.xl },
		artworkShadow: {
			borderWidth: theme.borders.thick,
			borderColor: theme.colors.border,
			...theme.shadows.large,
		},
		artwork: { backgroundColor: theme.colors.surfaceAlt },
		slot: { position: 'absolute', top: 0, left: 0 },
		slotText: { marginTop: CAROUSEL_TEXT_GAP },
		emptyArtwork: { alignItems: 'center', justifyContent: 'center' },
	});
	return styles;
}
