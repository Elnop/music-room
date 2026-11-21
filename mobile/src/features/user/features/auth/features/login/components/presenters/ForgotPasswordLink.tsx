import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type ForgotPasswordLinkProps = {
	onPress: () => void;
};

export function ForgotPasswordLink({ onPress }: ForgotPasswordLinkProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Pressable
			onPress={onPress}
			style={styles.forgotPasswordButton}
			accessibilityLabel="Mot de passe oublié ?"
		>
			<Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		forgotPasswordButton: {
			alignItems: 'center',
			marginTop: theme.spacing.md,
			marginBottom: theme.spacing.sm,
		},
		forgotPasswordText: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.primary,
			fontFamily: theme.typography.families.semibold,
		},
	});
	return styles;
}
