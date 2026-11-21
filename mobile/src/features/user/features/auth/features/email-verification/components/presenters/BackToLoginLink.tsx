import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type BackToLoginLinkProps = {
	onPress: () => void;
};

export function BackToLoginLink({ onPress }: BackToLoginLinkProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<Pressable
			style={styles.backButton}
			onPress={onPress}
			accessibilityLabel="Retour à la connexion"
		>
			<Text style={styles.backText}>Retour à la connexion</Text>
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		backButton: { marginTop: theme.spacing.sm },
		backText: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
