import { useEffect, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showSuccess } from '@/shared/theme/lib/toast';
import type { AuthStackParamList } from '@/features/user/features/auth/types';
import { newPasswordError } from '@/features/user/features/auth/features/reset-password/passwordRules';
import { useCodeInput } from '@/features/user/features/auth/shared/code-input/useCodeInput';
import type { CodeInput } from '@/features/user/features/auth/shared/code-input/useCodeInput';
import {
	useForgotPasswordMutation,
	useResetPasswordMutation,
} from '@/features/user/features/auth/shared/password-reset/usePasswordResetMutations';
import { useResendResetCode } from '@/features/user/features/auth/features/reset-password/hooks/useResendResetCode';

const BACK_TO_LOGIN_DELAY_MS = 1500;

export type ResetPassword = {
	code: CodeInput;
	newPassword: string;
	changeNewPassword: (text: string) => void;
	confirmation: string;
	changeConfirmation: (text: string) => void;
	passwordError: string | null;
	submit: () => void;
	isLoading: boolean;
	error: string | null;
	resend: () => void;
	cooldown: number;
};

export function useResetPassword(
	email: string,
	navigation: NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>
): ResetPassword {
	const code = useCodeInput();
	const [newPassword, setNewPassword] = useState('');
	const [confirmation, setConfirmation] = useState('');
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const reset = useResetPasswordMutation();
	const forgot = useForgotPasswordMutation();
	const resendCode = useResendResetCode(email, forgot, reset.reset);

	const { focusFirst } = code;
	useEffect(() => focusFirst(), [focusFirst]);

	function submit() {
		const fullCode = code.digits.join('');
		if (fullCode.length !== 6) return;
		const invalid = newPasswordError(newPassword, confirmation);
		setPasswordError(invalid);
		if (invalid) return;

		forgot.reset();
		reset.mutate(
			{ email, code: fullCode, password: newPassword },
			{
				onSuccess: () => {
					showSuccess('Mot de passe réinitialisé avec succès');
					setTimeout(() => navigation.navigate('Login'), BACK_TO_LOGIN_DELAY_MS);
				},
			}
		);
	}

	const failure = reset.error
		? apiErrorMessage(reset.error, 'Impossible de réinitialiser le mot de passe')
		: forgot.error
			? apiErrorMessage(forgot.error, "Impossible d'envoyer le code de réinitialisation")
			: null;

	return {
		code,
		newPassword,
		changeNewPassword: text => {
			setNewPassword(text);
			setPasswordError(null);
		},
		confirmation,
		changeConfirmation: text => {
			setConfirmation(text);
			setPasswordError(null);
		},
		passwordError,
		submit,
		isLoading: reset.isPending || forgot.isPending,
		error: failure,
		resend: () => void resendCode.resend(),
		cooldown: resendCode.cooldown,
	};
}
