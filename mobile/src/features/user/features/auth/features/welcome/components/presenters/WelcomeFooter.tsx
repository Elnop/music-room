import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { WelcomeActions } from '@/features/user/features/auth/features/welcome/welcomeTypes';

type WelcomeFooterProps = {
	buildLabel: string;
	actions: WelcomeActions;
};

export function WelcomeFooter({ buildLabel, actions }: WelcomeFooterProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<>
			<Pressable
				onPress={actions.onOpenPrivacyPolicy}
				accessibilityRole="link"
				accessibilityLabel="Politique de confidentialité"
				style={styles.privacyLink}
			>
				<Text style={styles.privacyLinkText}>Politique de confidentialité</Text>
			</Pressable>
			<Text style={styles.buildLabel}>{buildLabel}</Text>
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		privacyLink: {
			alignSelf: 'center',
			marginBottom: theme.spacing.sm,
		},
		privacyLinkText: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			textDecorationLine: 'underline',
		},
		buildLabel: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			textAlign: 'center',
		},
	});
	return styles;
}
