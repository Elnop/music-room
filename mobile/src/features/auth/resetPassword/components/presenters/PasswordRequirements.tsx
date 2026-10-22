import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

const LINES = [
	'Le mot de passe doit contenir :',
	'• Au moins 8 caractères',
	'• Une majuscule (A-Z)',
	'• Une minuscule (a-z)',
	'• Un chiffre (0-9)',
];

/** The rules of a new password (utils/passwordRules.ts). */
export function PasswordRequirements() {
	const { theme } = useTheme();

	return (
		<View style={styles.requirements}>
			{LINES.map(line => (
				<Text key={line} style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
					{line}
				</Text>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	requirements: {
		marginTop: 8,
		paddingLeft: 8,
	},
	requirementText: {
		fontSize: 12,
		lineHeight: 18,
	},
});
