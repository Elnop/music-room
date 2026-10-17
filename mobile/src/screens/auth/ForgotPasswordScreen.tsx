import React, { useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthNavigator';
import { useAuthStore } from '@store/authStore';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { useTheme } from '@contexts/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ route, navigation }: Props) {
	const { theme } = useTheme();
	const { forgotPassword, isLoading, error } = useAuthStore();

	const [email, setEmail] = useState(route.params?.email ?? '');
	const [emailError, setEmailError] = useState<string | null>(null);

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email) {
			setEmailError("L'email est requis");
			return false;
		}
		if (!emailRegex.test(email)) {
			setEmailError('Saisissez un email valide');
			return false;
		}
		setEmailError(null);
		return true;
	};

	const handleSendCode = async () => {
		if (!validateEmail(email)) return;

		try {
			await forgotPassword(email);

			// Success - navigate directly to reset password screen
			navigation.navigate('ResetPassword', { email });
		} catch (_err) {
			// Error handled by store
		}
	};

	return (
		<KeyboardAvoidingView
			style={[styles.container, { backgroundColor: theme.colors.background }]}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
				{/* Header */}
				<View style={styles.header}>
					<Text style={[styles.title, { color: theme.colors.text }]}>Mot de passe oublié ?</Text>
					<Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
						Saisissez votre adresse email : nous vous enverrons un code pour réinitialiser votre mot
						de passe.
					</Text>
				</View>

				{/* Form */}
				<View style={styles.form}>
					<Input
						label="Email"
						value={email}
						onChangeText={text => {
							setEmail(text);
							setEmailError(null);
						}}
						placeholder="vous@exemple.com"
						keyboardType="email-address"
						autoCapitalize="none"
						autoComplete="email"
						error={emailError ?? undefined}
						editable={!isLoading}
					/>

					{error && (
						<View style={[styles.errorBox, { backgroundColor: theme.colors.error + '20' }]}>
							<Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
						</View>
					)}

					<Button
						title="Envoyer le code"
						onPress={handleSendCode}
						loading={isLoading}
						disabled={!email || isLoading}
						style={styles.button}
					/>
				</View>

				{/* Footer */}
				<View style={styles.footer}>
					<TouchableOpacity onPress={() => navigation.navigate('Login')}>
						<Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
							Vous vous en souvenez ?{' '}
							<Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Se connecter</Text>
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		flexGrow: 1,
		paddingHorizontal: 24,
		paddingTop: 60,
		paddingBottom: 32,
	},
	header: {
		marginBottom: 40,
	},
	title: {
		fontSize: 32,
		fontWeight: 'bold',
		marginBottom: 12,
	},
	subtitle: {
		fontSize: 16,
		lineHeight: 24,
	},
	form: {
		flex: 1,
	},
	errorBox: {
		padding: 12,
		borderRadius: 8,
		marginBottom: 16,
	},
	errorText: {
		fontSize: 14,
		lineHeight: 20,
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
