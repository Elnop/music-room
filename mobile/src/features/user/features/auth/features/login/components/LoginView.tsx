import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from '@/shared/theme/components/Button';
import { Input } from '@/shared/theme/components/Input';
import { Pressable } from '@/shared/theme/components/Pressable';
import { Text } from '@/shared/theme/components/Text';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import type { Theme } from '@/shared/theme/lib/types';
import { AuthFormFrame } from '@/features/user/features/auth/shared/auth-form/AuthFormFrame';
import { SocialSignInButtons } from '@/features/user/features/auth/shared/sign-in/SocialSignInButtons';
import type { FieldBinding } from '@/features/user/features/auth/shared/field-binding/useFieldBinding';
import type { GoogleButtonSlot } from '@/features/user/features/auth/types';
import { FONT_FAMILIES } from '@/shared/theme/lib/fonts';

interface LoginViewProps {
	email: FieldBinding;
	password: FieldBinding;
	isLoading: boolean;
	onSubmit: () => void;
	onForgotPassword: () => void;
	onRegister: () => void;
	onGoogle: () => void;
	onFacebook: () => void;
	googleButton?: GoogleButtonSlot;
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
	googleButton,
}: LoginViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<AuthFormFrame
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
				submitOnEnter={isLoading ? undefined : onSubmit}
			/>
			<Input
				label="Mot de passe"
				{...password}
				placeholder="Saisissez votre mot de passe"
				secureTextEntry
				autoCapitalize="none"
				submitOnEnter={isLoading ? undefined : onSubmit}
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

			<SocialSignInButtons
				onGoogle={onGoogle}
				onFacebook={onFacebook}
				disabled={isLoading}
				googleButton={googleButton}
			/>
		</AuthFormFrame>
	);
}

function createStyles(theme: Theme) {
	return StyleSheet.create({
		forgotPasswordButton: {
			alignItems: 'center',
			marginTop: 16,
			marginBottom: 8,
		},
		forgotPasswordText: {
			fontSize: 14,
			color: theme.colors.primary,
			fontFamily: FONT_FAMILIES.semibold,
		},
	});
}
