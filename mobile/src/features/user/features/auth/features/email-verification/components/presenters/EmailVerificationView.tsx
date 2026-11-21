import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { CodeInput } from '@/features/user/features/auth/shared/code-input/components/CodeInput';
import { EmailVerificationHeader } from '@/features/user/features/auth/features/email-verification/components/presenters/EmailVerificationHeader';
import { VerifyButton } from '@/features/user/features/auth/features/email-verification/components/presenters/VerifyButton';
import { ResendCodeLink } from '@/features/user/features/auth/features/email-verification/components/presenters/ResendCodeLink';
import { BackToLoginLink } from '@/features/user/features/auth/features/email-verification/components/presenters/BackToLoginLink';
import type { EmailVerification } from '@/features/user/features/auth/features/email-verification/emailVerificationTypes';

type EmailVerificationViewProps = {
	email: string;
	verification: EmailVerification;
	onBackToLogin: () => void;
};

export function EmailVerificationView({
	email,
	verification,
	onBackToLogin,
}: EmailVerificationViewProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<EmailVerificationHeader email={email} />
				<CodeInput
					code={verification.code}
					onChangeDigit={verification.changeDigit}
					options={{ autoFocus: true }}
				/>
				{verification.error && <Text style={styles.error}>{verification.error}</Text>}
				{verification.codeError && <Text style={styles.error}>{verification.codeError}</Text>}
				<VerifyButton verification={verification} />
				<ResendCodeLink verification={verification} />
				<BackToLoginLink onPress={onBackToLogin} />
			</View>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: { flex: 1, backgroundColor: theme.colors.background },
		content: {
			flex: 1,
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.xxxl,
			alignItems: 'center',
		},
		error: {
			fontSize: theme.typography.sizes.md,
			marginBottom: theme.spacing.md,
			textAlign: 'center',
			color: theme.colors.error,
		},
	});
	return styles;
}
