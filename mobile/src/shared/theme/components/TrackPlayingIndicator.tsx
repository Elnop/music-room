import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import SoundOnSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sound-on-solid.svg';

type TrackPlayingIndicatorProps = {
	state: { isCurrent: boolean; isPending?: boolean };
};

export function TrackPlayingIndicator({ state }: TrackPlayingIndicatorProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	if (state.isPending) {
		return (
			<ActivityIndicator
				size="small"
				color={theme.colors.primary}
				style={styles.playingIcon}
				accessibilityLabel="Lancement"
			/>
		);
	}
	if (!state.isCurrent) return null;
	return (
		<PixelIcon
			icon={SoundOnSolid}
			size={18}
			color={theme.colors.primary}
			style={styles.playingIcon}
			accessibilityLabel="En cours de lecture"
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		playingIcon: {
			marginRight: theme.spacing.sm,
		},
	});
	return styles;
}
