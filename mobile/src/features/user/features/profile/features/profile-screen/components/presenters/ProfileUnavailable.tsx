import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function ProfileUnavailable() {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.screenWrapper}>
			<Text style={styles.errorText}>Aucune donnée utilisateur</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		screenWrapper: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		errorText: {
			fontSize: theme.typography.sizes.lg,
			color: theme.colors.error,
			textAlign: 'center',
			marginTop: theme.spacing.xl,
		},
	});
	return styles;
}
