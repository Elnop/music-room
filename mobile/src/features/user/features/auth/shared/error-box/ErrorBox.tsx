import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type ErrorBoxProps = {
	message: string;
};

export function ErrorBox({ message }: ErrorBoxProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.errorBox}>
			<Text style={styles.errorText}>{message}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		errorBox: {
			padding: theme.spacing.smd,
			marginBottom: theme.spacing.md,
			backgroundColor: theme.colors.error + '20',
		},
		errorText: {
			fontSize: theme.typography.sizes.md,
			lineHeight: theme.typography.lineHeights.sm,
			color: theme.colors.error,
		},
	});
	return styles;
}
