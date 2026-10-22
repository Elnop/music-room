import { useEffect, useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { showSuccess } from '@/shared/utils/toast';
import type { AuthStackParamList } from '@/features/auth/types';
import { newPasswordError } from '@/features/auth/utils/passwordRules';
import { useCodeInput, type CodeInput } from '@/features/auth/code/hooks/useCodeInput';
import {
	useForgotPasswordMutation,
	useResetPasswordMutation,
} from '@/features/auth/hooks/usePasswordResetMutations';
import { useResendResetCode } from './useResendResetCode';

/** Delay before the login screen, after the success toast. */
const BACK_TO_LOGIN_DELAY_MS = 1500;

export interface ResetPassword {
	code: CodeInput;
	newPassword: string;
	changeNewPassword: (text: string) => void;
	confirmation: string;
	changeConfirmation: (text: string) => void;
	passwordError: string | null;
	submit: () => void;
	/** A reset or a resend is running. */
	isLoading: boolean;
	/** The failure of the last reset or resend. */
	error: string | null;
	resend: () => void;
	/** Seconds before the code may be sent again; 0 when it may. */
	cooldown: number;
}

/** The reset code and the new password; success leads back to the login screen. */
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

	const submit = () => {
		const fullCode = code.digits.join('');
		// The button waits for the six digits; nothing to show here.
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
	};

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
