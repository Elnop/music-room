import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { PANEL_CLOSE_ID } from '@/features/playback/shared/player/configs/playerConfig';
import { PANEL_GUTTER } from '@/features/playback/features/now-playing-panel/nowPlayingPanelConfig';
import TimesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/times-solid.svg';

type PanelHeaderProps = {
	onClose: () => void;
};

export function PanelHeader({ onClose }: PanelHeaderProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<View style={styles.header}>
			<Text style={styles.heading} accessibilityRole="header">
				En cours de lecture
			</Text>
			<Pressable
				style={styles.iconButton}
				onPress={onClose}
				nativeID={PANEL_CLOSE_ID}
				accessibilityLabel="Fermer le panneau"
			>
				<PixelIcon icon={TimesSolid} size={22} color={theme.colors.text} />
			</Pressable>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		header: {
			flexDirection: 'row',
			alignItems: 'center',
			justifyContent: 'space-between',
			paddingStart: PANEL_GUTTER,
			paddingEnd: theme.spacing.sm,
			paddingVertical: theme.spacing.sm,
		},
		heading: {
			fontSize: theme.typography.sizes.lg,
			fontFamily: theme.typography.families.bold,
			color: theme.colors.text,
		},
		iconButton: {
			width: theme.controls.iconButtonLarge,
			height: theme.controls.iconButtonLarge,
			alignItems: 'center',
			justifyContent: 'center',
		},
	});
	return styles;
}
