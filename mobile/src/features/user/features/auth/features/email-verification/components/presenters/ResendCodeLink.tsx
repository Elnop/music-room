import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { EmailVerification } from '@/features/user/features/auth/features/email-verification/emailVerificationTypes';

type ResendCodeLinkProps = {
	verification: EmailVerification;
};

function resendLabel(cooldown: number, isResending: boolean): string {
	if (cooldown > 0) return `Renvoyer dans ${cooldown} s`;
	return isResending ? 'Envoi…' : 'Renvoyer le code';
}

export function ResendCodeLink({ verification }: ResendCodeLinkProps) {
	const { styles } = useThemedStyles(createStyles);
	const disabled = verification.isResending || verification.cooldown > 0;

	return (
		<View style={styles.resendContainer}>
			<Text style={styles.resendText}>Code non reçu ? </Text>
			<Pressable
				onPress={verification.resend}
				disabled={disabled}
				accessibilityLabel="Renvoyer le code"
			>
				<Text style={[styles.resendLink, disabled && styles.resendLinkDisabled]}>
					{resendLabel(verification.cooldown, verification.isResending)}
				</Text>
			</Pressable>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		resendContainer: {
			flexDirection: 'row',
			alignItems: 'center',
			marginBottom: theme.spacing.md,
		},
		resendText: { fontSize: theme.typography.sizes.md, color: theme.colors.textSecondary },
		resendLink: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.primary,
		},
		resendLinkDisabled: { color: theme.colors.textSecondary },
	});
	return styles;
}
