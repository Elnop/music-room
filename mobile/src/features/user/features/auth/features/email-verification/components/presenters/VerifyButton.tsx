import React from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { displayText } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { EmailVerification } from '@/features/user/features/auth/features/email-verification/emailVerificationTypes';

type VerifyButtonProps = {
	verification: EmailVerification;
};

export function VerifyButton({ verification }: VerifyButtonProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const disabled = verification.isVerifying || !verification.code.isComplete;

	return (
		<Pressable
			style={[styles.button, disabled && styles.buttonDisabled]}
			onPress={verification.verify}
			disabled={disabled}
			accessibilityLabel="Vérifier"
		>
			{verification.isVerifying ? (
				<ActivityIndicator color={theme.colors.background} />
			) : (
				<Text style={styles.buttonText}>Vérifier</Text>
			)}
		</Pressable>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		button: {
			width: '100%',
			height: theme.controls.largeButton,
			justifyContent: 'center',
			alignItems: 'center',
			marginBottom: theme.spacing.lg,
			backgroundColor: theme.colors.primary,
		},
		buttonDisabled: { opacity: 0.5 },
		buttonText: {
			...displayText(theme, theme.typography.sizes.lg, 'button'),
			textTransform: 'uppercase',
			color: theme.colors.background,
		},
	});
	return styles;
}
