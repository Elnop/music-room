import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import { PasswordScreenLayout } from '@/features/auth/form/components/presenters/PasswordScreenLayout';
import { ErrorBox } from '@/features/auth/form/components/presenters/ErrorBox';
import type { ForgotPassword } from '@/features/auth/forgotPassword/hooks/useForgotPassword';

export function ForgotPasswordView({ form }: { form: ForgotPassword }) {
	const { theme } = useTheme();

	return (
		<PasswordScreenLayout
			title="Mot de passe oublié ?"
			subtitle="Saisissez votre adresse email : nous vous enverrons un code pour réinitialiser votre mot de passe."
			headerSpacing={40}
		>
			<View style={styles.form}>
				<Input
					label="Email"
					value={form.email}
					onChangeText={form.changeEmail}
					placeholder="vous@exemple.com"
					keyboardType="email-address"
					autoCapitalize="none"
					autoComplete="email"
					error={form.emailError ?? undefined}
					editable={!form.isSending}
					submitOnEnter={form.email && !form.isSending ? form.sendCode : undefined}
				/>

				{form.error && <ErrorBox message={form.error} />}

				<Button
					title="Envoyer le code"
					onPress={form.sendCode}
					loading={form.isSending}
					disabled={!form.email || form.isSending}
					style={styles.button}
				/>
			</View>

			<View style={styles.footer}>
				<Pressable onPress={form.goToLogin} accessibilityLabel="Se connecter">
					<Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
						Vous vous en souvenez ?{' '}
						<Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Se connecter</Text>
					</Text>
				</Pressable>
			</View>
		</PasswordScreenLayout>
	);
}

const styles = StyleSheet.create({
	form: {
		flex: 1,
	},
	button: {
		marginTop: 24,
	},
	footer: {
		alignItems: 'center',
		marginTop: 24,
	},
	footerText: {
		fontSize: 14,
	},
});
