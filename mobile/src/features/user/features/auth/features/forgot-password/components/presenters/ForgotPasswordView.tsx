import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { PasswordScreenFrame } from '@/features/user/features/auth/shared/password-screen/components/PasswordScreenFrame';
import { ErrorBox } from '@/features/user/features/auth/shared/error-box/ErrorBox';
import { ResetEmailInput } from '@/features/user/features/auth/features/forgot-password/components/presenters/ResetEmailInput';
import { RememberedPasswordLink } from '@/features/user/features/auth/features/forgot-password/components/presenters/RememberedPasswordLink';
import type { ForgotPassword } from '@/features/user/features/auth/features/forgot-password/forgotPasswordTypes';

type ForgotPasswordViewProps = {
	form: ForgotPassword;
};

export function ForgotPasswordView({ form }: ForgotPasswordViewProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<PasswordScreenFrame
			title="Mot de passe oublié ?"
			subtitle="Saisissez votre adresse email : nous vous enverrons un code pour réinitialiser votre mot de passe."
		>
			<View style={styles.form}>
				<ResetEmailInput form={form} />
				{form.error && <ErrorBox message={form.error} />}
				<Button
					title="Envoyer le code"
					onPress={form.sendCode}
					loading={form.isSending}
					disabled={!form.email || form.isSending}
					style={styles.button}
				/>
			</View>
			<RememberedPasswordLink onPress={form.goToLogin} />
		</PasswordScreenFrame>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		form: {
			flex: 1,
		},
		button: {
			marginTop: theme.spacing.lg,
		},
	});
	return styles;
}
