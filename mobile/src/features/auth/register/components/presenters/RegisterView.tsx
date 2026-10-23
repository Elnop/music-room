import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { AuthFormLayout } from '@/features/auth/form/components/presenters/AuthFormLayout';
import { SocialSignInButtons } from '@/features/auth/social/components/presenters/SocialSignInButtons';
import type { FieldBinding } from '@/features/auth/form/hooks/useFieldBinding';

interface RegisterViewProps {
	email: FieldBinding;
	username: FieldBinding;
	password: FieldBinding;
	/** Any sign-up or sign-in is running: the buttons wait. */
	isLoading: boolean;
	bottomInset: number;
	onSubmit: () => void;
	onLogin: () => void;
	onGoogle: () => void;
	onFacebook: () => void;
}

export function RegisterView({
	email,
	username,
	password,
	isLoading,
	bottomInset,
	onSubmit,
	onLogin,
	onGoogle,
	onFacebook,
}: RegisterViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);

	return (
		<AuthFormLayout
			logoSize={120}
			bottomInset={bottomInset}
			footerText="Déjà un compte ? "
			footerLink="Se connecter"
			onFooterLink={onLogin}
		>
			<Input
				label="Email"
				{...email}
				placeholder="vous@exemple.com"
				keyboardType="email-address"
				autoCapitalize="none"
			/>
			<Input
				label="Nom d'utilisateur"
				{...username}
				placeholder="votre_pseudo"
				autoCapitalize="none"
			/>
			<Input
				label="Mot de passe"
				{...password}
				placeholder="Choisissez un mot de passe robuste"
				secureTextEntry
				autoCapitalize="none"
			/>

			<View style={styles.passwordHint}>
				<Text style={styles.passwordHintText}>
					Le mot de passe doit contenir :{'\n'}• Au moins 8 caractères{'\n'}• Une majuscule
					{'\n'}• Un chiffre{'\n'}• Un caractère spécial
				</Text>
			</View>

			<Button
				title="Créer un compte"
				onPress={onSubmit}
				loading={isLoading}
				fullWidth
				variant="primary"
			/>

			<SocialSignInButtons onGoogle={onGoogle} onFacebook={onFacebook} disabled={isLoading} />
		</AuthFormLayout>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		passwordHint: {
			backgroundColor: theme.colors.surface,
			padding: theme.spacing.sm,
			borderRadius: 8,
			marginTop: -theme.spacing.xs,
		},
		passwordHintText: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
			lineHeight: 16,
		},
	});
