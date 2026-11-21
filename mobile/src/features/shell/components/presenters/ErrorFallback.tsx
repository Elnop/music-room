import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { originalTheme } from '@/shared/theme/configs/originalThemeConfig';
import { Text } from '@/shared/theme/components/Text';
import { FONT_FAMILIES } from '@/shared/theme/configs/fontsConfig';
import { ErrorStack } from '@/features/shell/components/presenters/ErrorStack';

type ErrorFallbackProps = {
	error: Error;
	componentStack: string | null;
	onReset: () => void;
};

export function ErrorFallback({ error, componentStack, onReset }: ErrorFallbackProps) {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Une erreur s'est produite</Text>
			<Text style={styles.error}>
				{__DEV__ && error.message ? error.message : 'Une erreur inattendue est survenue.'}
			</Text>
			{__DEV__ && error.stack && <ErrorStack title="Stack Trace:" stack={error.stack} />}
			{__DEV__ && componentStack && <ErrorStack title="Component Stack:" stack={componentStack} />}
			<Pressable style={styles.button} onPress={onReset} accessibilityLabel="Réessayer">
				<Text style={styles.buttonText}>Réessayer</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: originalTheme.spacing.lg,
		backgroundColor: originalTheme.colors.background,
	},
	title: {
		fontSize: originalTheme.typography.sizes.xxl,
		fontFamily: FONT_FAMILIES.bold,
		color: originalTheme.colors.error,
		marginBottom: originalTheme.spacing.md,
	},
	error: {
		fontSize: originalTheme.typography.sizes.lg,
		color: originalTheme.colors.text,
		marginBottom: originalTheme.spacing.md,
		textAlign: 'center',
	},
	button: {
		backgroundColor: originalTheme.colors.primary,
		paddingVertical: originalTheme.spacing.smd,
		paddingHorizontal: originalTheme.spacing.lg,
		borderWidth: originalTheme.borders.thin,
		borderColor: originalTheme.colors.shadow,
		marginTop: originalTheme.spacing.md,
	},
	buttonText: {
		fontSize: originalTheme.typography.sizes.lg,
		fontFamily: FONT_FAMILIES.bold,
		color: originalTheme.colors.onColor,
	},
});
