import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';

export function FollowsYouBadge() {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.followsYouBadge}>
			<Text style={styles.followsYouText}>Vous suit</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		followsYouBadge: {
			backgroundColor: theme.colors.surface,
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: theme.spacing.xxs,
			borderWidth: theme.borders.hairline,
			borderColor: theme.colors.border,
		},
		followsYouText: {
			fontSize: theme.typography.sizes.xsm,
			color: theme.colors.textSecondary,
			fontFamily: theme.typography.families.medium,
		},
	});
	return styles;
}
