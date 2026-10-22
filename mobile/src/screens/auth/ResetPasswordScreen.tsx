import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	Text,
	StyleSheet,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
	TouchableOpacity,
	TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/navigation/AuthNavigator';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useTheme } from '@/shared/theme/ThemeContext';
import { showError, showSuccess, showInfo } from '@/shared/utils/toast';
import { CODE_INPUT_MAX_LENGTH, fillCodeDigits } from '@/utils/codeDigits';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ route, navigation }: Props) {
	const { email } = route.params;
	const { theme } = useTheme();
	const { resetPassword, forgotPassword, canResendResetCode, isLoading, error } = useAuthStore();

	// 6-digit code state (array of 6 digits)
	const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
	const [codeError, setCodeError] = useState<string | null>(null);
	const inputRefs = useRef<Array<TextInput | null>>([]);

	// Password state
	const [newPassword, setNewPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [passwordError, setPasswordError] = useState<string | null>(null);

	// Resend cooldown
	const [canResend, setCanResend] = useState(true);
	const [cooldownSeconds, setCooldownSeconds] = useState(0);

	// Auto-focus first input on mount
	useEffect(() => {
		inputRefs.current[0]?.focus();
	}, []);

	// Cooldown timer - update both countdown and canResend state
	useEffect(() => {
		if (cooldownSeconds > 0) {
			const timer = setTimeout(() => {
				setCooldownSeconds(prev => {
					const newValue = prev - 1;
					// When countdown reaches 0, update canResend in next render cycle
					if (newValue === 0) {
						setTimeout(() => setCanResend(true), 0);
					}
					return newValue;
				});
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [cooldownSeconds]);

	// Handle code input change
	const handleCodeChange = (index: number, value: string) => {
		const result = fillCodeDigits(code, index, value);
		if (!result) return;

		setCode(result.code);
		if (result.focusIndex !== null) {
			inputRefs.current[result.focusIndex]?.focus();
		}
	};

	// Handle backspace
	const handleKeyPress = (index: number, key: string) => {
		if (key === 'Backspace' && !code[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	// Validate password
	const validatePassword = (): boolean => {
		if (!newPassword) {
			setPasswordError('Le mot de passe est requis');
			return false;
		}
		if (newPassword.length < 8) {
			setPasswordError('Le mot de passe doit contenir au moins 8 caractères');
			return false;
		}
		if (!/[A-Z]/.test(newPassword)) {
			setPasswordError('Le mot de passe doit contenir au moins une majuscule');
			return false;
		}
		if (!/[a-z]/.test(newPassword)) {
			setPasswordError('Le mot de passe doit contenir au moins une minuscule');
			return false;
		}
		if (!/[0-9]/.test(newPassword)) {
			setPasswordError('Le mot de passe doit contenir au moins un chiffre');
			return false;
		}
		if (newPassword !== confirmPassword) {
			setPasswordError('Les mots de passe ne correspondent pas');
			return false;
		}
		setPasswordError(null);
		return true;
	};

	// Handle reset password
	const handleResetPassword = async () => {
		const codeString = code.join('');

		if (codeString.length !== 6) {
			setCodeError('Saisissez le code à 6 chiffres.');
			return;
		}

		setCodeError(null);
		if (!validatePassword()) return;

		try {
			await resetPassword(email, codeString, newPassword);

			// Success - show toast and navigate to login
			showSuccess('Mot de passe réinitialisé avec succès');
			setTimeout(() => navigation.navigate('Login'), 1500);
		} catch (_err) {
			// Error handled by store
		}
	};

	// Handle resend code
	const handleResendCode = async () => {
		try {
			// Check if can resend
			const resendStatus = await canResendResetCode(email);

			if (!resendStatus.canResend) {
				setCooldownSeconds(resendStatus.remainingSeconds);
				setCanResend(false);
				// Show info via inline message (cooldown already shown in button)
				return;
			}

			// Resend
			await forgotPassword(email);

			// Set cooldown
			setCooldownSeconds(60);
			setCanResend(false);

			showSuccess('Code renvoyé à votre email');
		} catch (_err) {
			showError('Échec envoi du code. Réessayez.');
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
					<Text style={[styles.title, { color: theme.colors.text }]}>Nouveau mot de passe</Text>
					<Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
						Saisissez le code à 6 chiffres envoyé à{'\n'}
						<Text style={{ fontWeight: '600' }}>{email}</Text>
					</Text>
				</View>

				{/* Code Input (6 digits) */}
				<View style={styles.codeContainer}>
					{code.map((digit, index) => (
						<TextInput
							key={index}
							ref={ref => {
								inputRefs.current[index] = ref;
							}}
							style={[
								styles.codeInput,
								{
									backgroundColor: theme.colors.surface,
									color: theme.colors.text,
									borderColor: digit ? theme.colors.primary : theme.colors.border,
								},
							]}
							value={digit}
							onChangeText={value => handleCodeChange(index, value)}
							onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(index, key)}
							keyboardType="number-pad"
							maxLength={CODE_INPUT_MAX_LENGTH}
							autoComplete={index === 0 ? 'sms-otp' : 'off'}
							textContentType={index === 0 ? 'oneTimeCode' : 'none'}
							selectTextOnFocus
							editable={!isLoading}
						/>
					))}
				</View>

				{/* Password Inputs */}
				<View style={styles.passwordSection}>
					<Input
						label="Nouveau mot de passe"
						value={newPassword}
						onChangeText={text => {
							setNewPassword(text);
							setPasswordError(null);
						}}
						placeholder="Saisissez le nouveau mot de passe"
						secureTextEntry
						autoCapitalize="none"
						error={passwordError ?? undefined}
						editable={!isLoading}
					/>

					<Input
						label="Confirmation"
						value={confirmPassword}
						onChangeText={text => {
							setConfirmPassword(text);
							setPasswordError(null);
						}}
						placeholder="Saisissez-le à nouveau"
						secureTextEntry
						autoCapitalize="none"
						editable={!isLoading}
					/>

					{/* Password Requirements */}
					<View style={styles.requirements}>
						<Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
							Le mot de passe doit contenir :
						</Text>
						<Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
							• Au moins 8 caractères
						</Text>
						<Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
							• Une majuscule (A-Z)
						</Text>
						<Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
							• Une minuscule (a-z)
						</Text>
						<Text style={[styles.requirementText, { color: theme.colors.textSecondary }]}>
							• Un chiffre (0-9)
						</Text>
					</View>
				</View>

				{/* Error */}
				{error && (
					<View style={[styles.errorBox, { backgroundColor: theme.colors.error + '20' }]}>
						<Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
					</View>
				)}

				{/* Submit Button */}
				<Button
					title="Réinitialiser le mot de passe"
					onPress={handleResetPassword}
					loading={isLoading}
					disabled={isLoading || code.some(d => !d) || !newPassword || !confirmPassword}
					style={styles.button}
				/>

				{/* Resend Code */}
				<View style={styles.resendContainer}>
					<Text style={[styles.resendText, { color: theme.colors.textSecondary }]}>
						Code non reçu ?{' '}
					</Text>
					{canResend ? (
						<TouchableOpacity onPress={handleResendCode} disabled={isLoading}>
							<Text style={[styles.resendLink, { color: theme.colors.primary }]}>
								Renvoyer le code
							</Text>
						</TouchableOpacity>
					) : (
						<Text style={[styles.resendCooldown, { color: theme.colors.textSecondary }]}>
							Renvoyer dans {cooldownSeconds} s
						</Text>
					)}
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
		marginBottom: 32,
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
	codeContainer: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 32,
	},
	codeInput: {
		width: 48,
		height: 56,
		borderRadius: 12,
		borderWidth: 2,
		fontSize: 24,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	passwordSection: {
		marginBottom: 16,
	},
	requirements: {
		marginTop: 8,
		paddingLeft: 8,
	},
	requirementText: {
		fontSize: 12,
		lineHeight: 18,
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
		marginTop: 8,
	},
	resendContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 24,
	},
	resendText: {
		fontSize: 14,
	},
	resendLink: {
		fontSize: 14,
		fontWeight: '600',
	},
	resendCooldown: {
		fontSize: 14,
		fontStyle: 'italic',
	},
});
