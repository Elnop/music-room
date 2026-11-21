import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type RememberedPasswordLinkProps = {
	onPress: () => void;
};

export function RememberedPasswordLink({ onPress }: RememberedPasswordLinkProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.footer}>
			<Pressable onPress={onPress} accessibilityLabel="Se connecter">
				<Text style={styles.footerText}>
					Vous vous en souvenez ? <Text style={styles.footerLink}>Se connecter</Text>
				</Text>
			</Pressable>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		footer: {
			alignItems: 'center',
			marginTop: theme.spacing.lg,
		},
		footerText: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
		},
		footerLink: {
			color: theme.colors.primary,
			fontFamily: theme.typography.families.semibold,
		},
	});
	return styles;
}
