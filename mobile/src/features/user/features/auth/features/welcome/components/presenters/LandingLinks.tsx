import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { SOURCE_CODE_URL } from '@/shared/project-links/projectLinksConfig';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { WelcomeActions } from '@/features/user/features/auth/features/welcome/welcomeTypes';

type LandingLinksProps = {
	actions: WelcomeActions;
};

export function LandingLinks({ actions }: LandingLinksProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.footerLinks}>
			<Pressable
				accessibilityRole="link"
				accessibilityLabel="Politique de confidentialité"
				onPress={actions.onOpenPrivacyPolicy}
			>
				<Text style={styles.footerLink}>Politique de confidentialité</Text>
			</Pressable>
			<Text style={styles.separator}>·</Text>
			<Pressable
				accessibilityRole="link"
				accessibilityLabel="Code source"
				onPress={() => actions.onOpenLink(SOURCE_CODE_URL)}
			>
				<Text style={styles.footerLink}>Code source</Text>
			</Pressable>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		footerLinks: {
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'center',
			gap: theme.spacing.sm,
		},
		footerLink: {
			fontSize: theme.typography.sizes.md,
			color: theme.colors.textSecondary,
			textDecorationLine: 'underline',
		},
		separator: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
