import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/shared/theme/ThemeContext';
import { CodeInput } from '@/features/auth/code/components/presenters/CodeInput';
import { PasswordScreenLayout } from '@/features/auth/form/components/presenters/PasswordScreenLayout';
import { ErrorBox } from '@/features/auth/form/components/presenters/ErrorBox';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Pressable } from '@/shared/components/ui/Pressable';
import type { ResetPassword } from '@/features/auth/resetPassword/hooks/useResetPassword';
import { PasswordRequirements } from './PasswordRequirements';

interface ResetPasswordViewProps {
	email: string;
	form: ResetPassword;
}

export function ResetPasswordView({ email, form }: ResetPasswordViewProps) {
	const { theme } = useTheme();
	const secondary = { color: theme.colors.textSecondary };
	const canSubmit =
		!form.isLoading && form.code.isComplete && !!form.newPassword && !!form.confirmation;

	return (
		<PasswordScreenLayout
			title="Nouveau mot de passe"
			subtitle={
				<>
					Saisissez le code à 6 chiffres envoyé à{'\n'}
					<Text style={styles.email}>{email}</Text>
				</>
			}
			headerSpacing={32}
		>
			<CodeInput
				digits={form.code.digits}
				setBoxRef={form.code.setBoxRef}
				onChangeDigit={(index, text) => form.code.changeDigit(index, text)}
				onKeyPress={form.code.pressKey}
				containerStyle={styles.codeContainer}
				boxStyle={filled => [
					styles.codeInput,
					{
						backgroundColor: theme.colors.surface,
						color: theme.colors.text,
						borderColor: filled ? theme.colors.primary : theme.colors.border,
					},
				]}
				editable={!form.isLoading}
			/>

			<View style={styles.passwordSection}>
				<Input
					label="Nouveau mot de passe"
					value={form.newPassword}
					onChangeText={form.changeNewPassword}
					placeholder="Saisissez le nouveau mot de passe"
					secureTextEntry
					autoCapitalize="none"
					error={form.passwordError ?? undefined}
					editable={!form.isLoading}
				/>
				<Input
					label="Confirmation"
					value={form.confirmation}
					onChangeText={form.changeConfirmation}
					placeholder="Saisissez-le à nouveau"
					secureTextEntry
					autoCapitalize="none"
					editable={!form.isLoading}
					submitOnEnter={canSubmit ? form.submit : undefined}
				/>
				<PasswordRequirements />
			</View>

			{form.error && <ErrorBox message={form.error} />}

			<Button
				title="Réinitialiser le mot de passe"
				onPress={form.submit}
				loading={form.isLoading}
				disabled={!canSubmit}
				style={styles.button}
			/>

			<View style={styles.resendContainer}>
				<Text style={[styles.resendText, secondary]}>Code non reçu ? </Text>
				{form.cooldown === 0 ? (
					<Pressable
						onPress={form.resend}
						disabled={form.isLoading}
						accessibilityLabel="Renvoyer le code"
					>
						<Text style={[styles.resendLink, { color: theme.colors.primary }]}>
							Renvoyer le code
						</Text>
					</Pressable>
				) : (
					<Text style={[styles.resendCooldown, secondary]}>Renvoyer dans {form.cooldown} s</Text>
				)}
			</View>
		</PasswordScreenLayout>
	);
}

const styles = StyleSheet.create({
	email: { fontWeight: '600' },
	codeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
	codeInput: {
		width: 48,
		height: 56,
		borderRadius: 12,
		borderWidth: 2,
		fontSize: 24,
		fontWeight: 'bold',
		textAlign: 'center',
	},
	passwordSection: { marginBottom: 16 },
	button: { marginTop: 8 },
	resendContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginTop: 24,
	},
	resendText: { fontSize: 14 },
	resendLink: { fontSize: 14, fontWeight: '600' },
	resendCooldown: { fontSize: 14, fontStyle: 'italic' },
});
