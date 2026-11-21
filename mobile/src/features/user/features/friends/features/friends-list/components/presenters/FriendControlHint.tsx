import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type FriendControlHintProps = {
	canControl: boolean;
};

export function FriendControlHint({ canControl }: FriendControlHintProps) {
	const { theme, styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.controlRow}>
			<PixelIcon
				icon={MusicSolid}
				size={12}
				color={canControl ? theme.colors.primary : theme.colors.textSecondary}
				style={styles.controlIcon}
			/>
			<Text style={[styles.controlText, canControl && styles.controlTextActive]}>
				Tous mes appareils
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		controlRow: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: theme.spacing.xs,
		},
		controlIcon: {
			marginRight: theme.spacing.xs,
		},
		controlText: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
		},
		controlTextActive: {
			color: theme.colors.primary,
			fontFamily: theme.typography.families.medium,
		},
	});
	return styles;
}
