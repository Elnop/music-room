import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

const LINES = [
	'Le mot de passe doit contenir :',
	'• Au moins 8 caractères',
	'• Une majuscule (A-Z)',
	'• Une minuscule (a-z)',
	'• Un chiffre (0-9)',
];

export function PasswordRequirements() {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.requirements}>
			{LINES.map((line) => (
				<Text key={line} style={styles.requirementText}>
					{line}
				</Text>
			))}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		requirements: {
			marginTop: theme.spacing.sm,
			marginBottom: theme.spacing.md,
			paddingLeft: theme.spacing.sm,
		},
		requirementText: {
			fontSize: theme.typography.sizes.sm,
			lineHeight: theme.typography.lineHeights.xs,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
