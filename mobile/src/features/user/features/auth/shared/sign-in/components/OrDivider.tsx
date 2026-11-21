import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function OrDivider() {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.divider}>
			<View style={styles.line} />
			<Text style={styles.label}>OU</Text>
			<View style={styles.line} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		divider: {
			flexDirection: 'row',
			alignItems: 'center',
			marginVertical: theme.spacing.lg,
		},
		line: {
			flex: 1,
			height: theme.borders.hairline,
			backgroundColor: theme.colors.divider,
		},
		label: {
			marginHorizontal: theme.spacing.md,
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
