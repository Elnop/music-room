import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useInsetStyles } from '@/features/playback/features/player-modal/hooks/useInsetStyles';
import { textColor } from '@/features/playback/features/player-modal/lib/dynamicStyles';
import {
	HEADER_BUTTON_SIZE,
	LOADING_INSET,
} from '@/features/playback/features/player-modal/playerModalConfig';
import type { ScreenInsets } from '@/features/playback/features/player-modal/playerModalTypes';
import type { Theme } from '@/shared/theme/types/themeTypes';

type PlayerLoadingNoticeProps = {
	color: string;
};

export function PlayerLoadingNotice({ color }: PlayerLoadingNoticeProps) {
	const { styles } = useInsetStyles(createStyles);

	return (
		<View style={styles.loadingContainer} pointerEvents="none">
			<Text style={[styles.loadingText, textColor(color)]}>Chargement du flux audio…</Text>
		</View>
	);
}

function createStyles(theme: Theme, insets: ScreenInsets) {
	const styles = StyleSheet.create({
		loadingContainer: {
			position: 'absolute',
			top: insets.top + theme.spacing.md,
			left: LOADING_INSET,
			right: LOADING_INSET,
			height: HEADER_BUTTON_SIZE,
			alignItems: 'center',
			justifyContent: 'center',
		},
		loadingText: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
		},
	});
	return styles;
}
