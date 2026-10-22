import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { AuthFormLayout } from '@/features/auth/form/components/presenters/AuthFormLayout';
import { SocialSignInButtons } from '@/features/auth/social/components/presenters/SocialSignInButtons';
import type { FieldBinding } from '@/features/auth/form/hooks/useFieldBinding';

interface LoginViewProps {
	email: FieldBinding;
	password: FieldBinding;
	/** Any sign-in is running: the buttons wait. */
	isLoading: boolean;
	onSubmit: () => void;
	onForgotPassword: () => void;
	onRegister: () => void;
	onGoogle: () => void;
	onFacebook: () => void;
}

export function LoginView({
	email,
	password,
	isLoading,
	onSubmit,
	onForgotPassword,
	onRegister,
	onGoogle,
	onFacebook,
}: LoginViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<AuthFormLayout
			logoSize={150}
			footerText="Pas encore de compte ? "
			footerLink="S'inscrire"
			onFooterLink={onRegister}
		>
			<Input
				label="Email"
				{...email}
				placeholder="demo@zumik.com"
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<Input
				label="Mot de passe"
				{...password}
				placeholder="Saisissez votre mot de passe"
				secureTextEntry
				autoCapitalize="none"
			/>

			<Button
				title="Se connecter"
				onPress={onSubmit}
				loading={isLoading}
				fullWidth
				variant="primary"
			/>

			<Pressable
				onPress={onForgotPassword}
				style={styles.forgotPasswordButton}
				accessibilityLabel="Mot de passe oublié ?"
			>
				<Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
			</Pressable>

			<SocialSignInButtons onGoogle={onGoogle} onFacebook={onFacebook} disabled={isLoading} />
		</AuthFormLayout>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		forgotPasswordButton: {
			alignItems: 'center',
			marginTop: 16,
			marginBottom: 8,
		},
		forgotPasswordText: {
			fontSize: 14,
			color: theme.colors.primary,
			fontWeight: '600',
		},
	});
