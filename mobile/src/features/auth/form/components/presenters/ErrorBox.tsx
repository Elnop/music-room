import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';

export function ErrorBox({ message }: { message: string }) {
	const { theme } = useTheme();

	return (
		<View style={[styles.errorBox, { backgroundColor: theme.colors.error + '20' }]}>
			<Text style={[styles.errorText, { color: theme.colors.error }]}>{message}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	errorBox: {
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
	},
	errorText: {
		fontSize: 14,
		lineHeight: 20,
	},
});
