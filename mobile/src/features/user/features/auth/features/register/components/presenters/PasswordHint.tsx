import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

export function PasswordHint() {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.passwordHint}>
			<Text style={styles.passwordHintText}>
				Le mot de passe doit contenir :{'\n'}• Au moins 8 caractères{'\n'}• Une majuscule
				{'\n'}• Un chiffre{'\n'}• Un caractère spécial
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		passwordHint: {
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.sm,
			marginTop: theme.spacing.pullXs,
		},
		passwordHintText: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
			lineHeight: theme.typography.lineHeights.xxs,
		},
	});
	return styles;
}
