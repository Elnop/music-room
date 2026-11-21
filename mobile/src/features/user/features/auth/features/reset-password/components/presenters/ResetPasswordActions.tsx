import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { ErrorBox } from '@/features/user/features/auth/shared/error-box/ErrorBox';
import { ResendCodeLine } from '@/features/user/features/auth/features/reset-password/components/presenters/ResendCodeLine';
import type { ResetPassword } from '@/features/user/features/auth/features/reset-password/resetPasswordTypes';

type ResetPasswordActionsProps = {
	form: ResetPassword;
};

export function ResetPasswordActions({ form }: ResetPasswordActionsProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<>
			{form.error && <ErrorBox message={form.error} />}
			<Button
				title="Réinitialiser le mot de passe"
				onPress={form.submit}
				loading={form.isLoading}
				disabled={!form.canSubmit}
				style={styles.button}
			/>
			<ResendCodeLine cooldown={form.cooldown} disabled={form.isLoading} onResend={form.resend} />
		</>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		button: { marginTop: theme.spacing.sm },
	});
	return styles;
}
