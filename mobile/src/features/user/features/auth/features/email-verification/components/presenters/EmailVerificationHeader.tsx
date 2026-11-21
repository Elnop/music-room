import React from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';

type EmailVerificationHeaderProps = {
	email: string;
};

export function EmailVerificationHeader({ email }: EmailVerificationHeaderProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<>
			<Text style={styles.title}>Vérifiez votre email</Text>
			<Text style={styles.subtitle}>
				Nous avons envoyé un code à 6 chiffres à{'\n'}
				<Text style={styles.emailHighlight}>{email}</Text>
			</Text>
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		title: {
			fontSize: theme.typography.sizes.xxlg,
			fontFamily: theme.typography.families.bold,
			marginBottom: theme.spacing.smd,
			textAlign: 'center',
			color: theme.colors.text,
		},
		subtitle: {
			fontSize: theme.typography.sizes.lg,
			marginBottom: theme.spacing.xlg,
			textAlign: 'center',
			lineHeight: theme.typography.lineHeights.lg,
			color: theme.colors.textSecondary,
		},
		emailHighlight: { color: theme.colors.primary },
	});
	return styles;
}
