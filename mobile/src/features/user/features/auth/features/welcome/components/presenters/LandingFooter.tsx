import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { LandingLinks } from '@/features/user/features/auth/features/welcome/components/presenters/LandingLinks';
import type { WelcomeActions } from '@/features/user/features/auth/features/welcome/welcomeTypes';

type LandingFooterProps = {
	buildLabel: string;
	actions: WelcomeActions;
};

export function LandingFooter({ buildLabel, actions }: LandingFooterProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.footer}>
			<LandingLinks actions={actions} />
			<Text style={styles.footerText}>{buildLabel}</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		footer: {
			alignItems: 'center',
			gap: theme.spacing.sm,
			paddingVertical: theme.spacing.lg,
			borderTopWidth: StyleSheet.hairlineWidth,
			borderTopColor: theme.colors.borderSubtle,
		},
		footerText: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
		},
	});
	return styles;
}
