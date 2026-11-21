import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PlayerCloseKey } from '@/features/playback/features/player-modal/components/presenters/PlayerCloseKey';
import { PlayerLoadingNotice } from '@/features/playback/features/player-modal/components/presenters/PlayerLoadingNotice';
import { useInsetStyles } from '@/features/playback/features/player-modal/hooks/useInsetStyles';
import { backgroundColor } from '@/features/playback/features/player-modal/lib/dynamicStyles';
import { SWIPE_BAR_SIZE } from '@/features/playback/features/player-modal/playerModalConfig';
import type {
	PlayerColors,
	PlayerHeaderState,
	ScreenInsets,
} from '@/features/playback/features/player-modal/playerModalTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type PlayerHeaderProps = {
	colors: Pick<PlayerColors, 'textSecondary'>;
	state: PlayerHeaderState;
	onClose: () => void;
};

export function PlayerHeader({ colors, state, onClose }: PlayerHeaderProps) {
	const { styles } = useInsetStyles(createStyles);
	const barColor = state.dialog ? 'transparent' : colors.textSecondary;

	return (
		<View style={styles.header}>
			<View style={styles.swipeIndicator}>
				<View style={[styles.swipeBar, backgroundColor(barColor)]} />
			</View>
			<PlayerCloseKey dialog={state.dialog} onClose={onClose} />
			{state.isLoading && <PlayerLoadingNotice color={colors.textSecondary} />}
		</View>
	);
}

function createStyles(theme: Theme, insets: ScreenInsets) {
	const styles = StyleSheet.create({
		header: {
			paddingTop: insets.top + theme.spacing.sm,
			alignItems: 'center',
			paddingBottom: theme.spacing.sm,
		},
		swipeIndicator: { alignItems: 'center', marginBottom: theme.spacing.sm },
		swipeBar: { ...SWIPE_BAR_SIZE, opacity: 0.5 },
	});
	return styles;
}
