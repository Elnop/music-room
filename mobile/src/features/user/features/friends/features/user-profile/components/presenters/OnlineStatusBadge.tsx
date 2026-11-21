import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';

type OnlineStatusBadgeProps = {
	online: boolean;
};

export function OnlineStatusBadge({ online }: OnlineStatusBadgeProps) {
	const { styles } = useThemedStyles(createStyles);
	const { styles: dotStyles } = useThemedStyles(createDotStyles);

	return (
		<View style={[styles.statusBadge, online && styles.statusBadgeOnline]}>
			<View style={[dotStyles.statusDot, online && dotStyles.statusDotOnline]} />
			<Text style={[styles.statusText, online && styles.statusTextOnline]}>
				{online ? 'En ligne' : 'Hors ligne'}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		statusBadge: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surface,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: theme.spacing.xxsm,
			gap: theme.spacing.xs,
		},
		statusBadgeOnline: {
			backgroundColor: theme.colors.success + '20',
		},
		statusText: {
			fontSize: theme.typography.sizes.xsm,
			color: theme.colors.textSecondary,
			fontFamily: theme.typography.families.medium,
		},
		statusTextOnline: {
			color: theme.colors.success,
		},
	});
	return styles;
}

function createDotStyles(theme: Theme) {
	const dotStyles = StyleSheet.create({
		statusDot: {
			width: theme.controls.statusDot,
			height: theme.controls.statusDot,
			backgroundColor: theme.colors.textSecondary,
		},
		statusDotOnline: {
			backgroundColor: theme.colors.success,
		},
	});
	return dotStyles;
}
