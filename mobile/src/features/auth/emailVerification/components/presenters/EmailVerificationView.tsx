import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { Theme } from '@/shared/theme/types';
import { CodeInput } from '@/features/auth/code/components/presenters/CodeInput';
import type { EmailVerification } from '@/features/auth/emailVerification/hooks/useEmailVerification';

interface EmailVerificationViewProps {
	email: string;
	verification: EmailVerification;
	onBackToLogin: () => void;
}

function resendLabel(cooldown: number, isResending: boolean): string {
	if (cooldown > 0) return `Renvoyer dans ${cooldown} s`;
	return isResending ? 'Envoi…' : 'Renvoyer le code';
}

export function EmailVerificationView({
	email,
	verification: v,
	onBackToLogin,
}: EmailVerificationViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const verifyDisabled = v.isVerifying || !v.code.isComplete;
	const resendDisabled = v.isResending || v.cooldown > 0;

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Vérifiez votre email</Text>
				<Text style={styles.subtitle}>
					Nous avons envoyé un code à 6 chiffres à{'\n'}
					<Text style={styles.emailHighlight}>{email}</Text>
				</Text>

				<CodeInput
					digits={v.code.digits}
					setBoxRef={v.code.setBoxRef}
					onChangeDigit={v.changeDigit}
					onKeyPress={v.code.pressKey}
					containerStyle={styles.codeContainer}
					boxStyle={filled => [styles.codeInput, filled ? styles.filled : styles.empty]}
					autoFocus
				/>

				{v.error && <Text style={styles.error}>{v.error}</Text>}
				{v.codeError && <Text style={styles.error}>{v.codeError}</Text>}

				<Pressable
					style={[styles.button, verifyDisabled && styles.buttonDisabled]}
					onPress={v.verify}
					disabled={verifyDisabled}
					accessibilityLabel="Vérifier"
				>
					{v.isVerifying ? (
						<ActivityIndicator color={theme.colors.background} />
					) : (
						<Text style={styles.buttonText}>Vérifier</Text>
					)}
				</Pressable>

				<View style={styles.resendContainer}>
					<Text style={styles.resendText}>Code non reçu ? </Text>
					<Pressable
						onPress={v.resend}
						disabled={resendDisabled}
						accessibilityLabel="Renvoyer le code"
					>
						<Text style={[styles.resendLink, resendDisabled && styles.resendLinkDisabled]}>
							{resendLabel(v.cooldown, v.isResending)}
						</Text>
					</Pressable>
				</View>

				<Pressable
					style={styles.backButton}
					onPress={onBackToLogin}
					accessibilityLabel="Retour à la connexion"
				>
					<Text style={styles.backText}>Retour à la connexion</Text>
				</Pressable>
			</View>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: { flex: 1, backgroundColor: theme.colors.background },
		content: { flex: 1, paddingHorizontal: 24, paddingTop: 60, alignItems: 'center' },
		title: {
			fontSize: 28,
			fontWeight: 'bold',
			marginBottom: 12,
			textAlign: 'center',
			color: theme.colors.text,
		},
		subtitle: {
			fontSize: 16,
			marginBottom: 40,
			textAlign: 'center',
			lineHeight: 24,
			color: theme.colors.textSecondary,
		},
		emailHighlight: { color: theme.colors.primary },
		codeContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 24 },
		codeInput: {
			width: 50,
			height: 60,
			borderWidth: 2,
			borderRadius: 12,
			fontSize: 24,
			fontWeight: 'bold',
			textAlign: 'center',
			backgroundColor: theme.colors.surface,
			color: theme.colors.text,
		},
		filled: { borderColor: theme.colors.primary },
		empty: { borderColor: theme.colors.border },
		error: { fontSize: 14, marginBottom: 16, textAlign: 'center', color: theme.colors.error },
		button: {
			width: '100%',
			height: 56,
			borderRadius: 12,
			justifyContent: 'center',
			alignItems: 'center',
			marginBottom: 24,
			backgroundColor: theme.colors.primary,
		},
		buttonDisabled: { opacity: 0.5 },
		buttonText: { fontSize: 16, fontWeight: '600', color: theme.colors.background },
		resendContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
		resendText: { fontSize: 14, color: theme.colors.textSecondary },
		resendLink: { fontSize: 14, fontWeight: '600', color: theme.colors.primary },
		resendLinkDisabled: { color: theme.colors.textSecondary },
		backButton: { marginTop: 8 },
		backText: { fontSize: 14, fontWeight: '600', color: theme.colors.textSecondary },
	});
