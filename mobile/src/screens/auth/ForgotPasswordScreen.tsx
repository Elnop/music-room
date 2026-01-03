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
import { AuthStackParamList } from '@navigation/AuthNavigator';
import { useAuthStore } from '@store/authStore';
import { Input } from '@components/common/Input';
import { Button } from '@components/common/Button';
import { useTheme } from '@contexts/ThemeContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export function ForgotPasswordScreen({ navigation }: Props) {
	const { theme } = useTheme();
	const { forgotPassword, isLoading, error } = useAuthStore();

	const [email, setEmail] = useState('');
	const [emailError, setEmailError] = useState<string | null>(null);

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!email) {
			setEmailError('Email is required');
			return false;
		}
		if (!emailRegex.test(email)) {
			setEmailError('Please enter a valid email');
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
					<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
						<Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
					</TouchableOpacity>

					<Text style={[styles.title, { color: theme.colors.text }]}>Forgot Password?</Text>
					<Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
						Enter your email address and we'll send you a code to reset your password.
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
						placeholder="your.email@example.com"
						keyboardType="email-address"
						autoCapitalize="none"
						autoComplete="email"
						error={emailError}
						editable={!isLoading}
					/>

					{error && (
						<View style={[styles.errorBox, { backgroundColor: theme.colors.error + '20' }]}>
							<Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
						</View>
					)}

					<Button
						title="Send Reset Code"
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
							Remember your password?{' '}
							<Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Log In</Text>
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
	backButton: {
		marginBottom: 20,
	},
	backText: {
		fontSize: 16,
		fontWeight: '600',
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
