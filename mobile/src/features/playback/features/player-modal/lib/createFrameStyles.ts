import { StyleSheet } from 'react-native';
import { PLAYER_DIALOG_WIDTH } from '@/shared/theme/configs/layoutConfig';
import { DIALOG_MAX_HEIGHT } from '@/features/playback/features/player-modal/playerModalConfig';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { ScreenInsets } from '@/features/playback/features/player-modal/playerModalTypes';

export function createFrameStyles(theme: Theme, insets: ScreenInsets) {
	const styles = StyleSheet.create({
		container: { flex: 1 },
		modalContent: { backgroundColor: theme.colors.background },
		dialogFrame: { alignItems: 'center', justifyContent: 'center' },
		dialog: {
			flexGrow: 0,
			flexBasis: 'auto',
			width: PLAYER_DIALOG_WIDTH,
			height: '90%',
			maxHeight: DIALOG_MAX_HEIGHT,
			overflow: 'hidden',
			borderWidth: theme.borders.hairline,
			borderColor: theme.colors.borderSubtle,
		},
		dialogBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.colors.backdrop },
		bottomSpacer: { height: insets.bottom + theme.spacing.mdl },
	});
	return styles;
}
