import { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import type { AuthStackParamList } from '@/features/user/features/auth/types';
import { useForgotPasswordMutation } from '@/features/user/features/auth/shared/password-reset/usePasswordResetMutations';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export type ForgotPassword = {
	email: string;
	changeEmail: (email: string) => void;
	emailError: string | null;
	sendCode: () => void;
	isSending: boolean;
	error: string | null;
	goToLogin: () => void;
};

export function useForgotPassword(
	initialEmail: string,
	navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>
): ForgotPassword {
	const [email, setEmail] = useState(initialEmail);
	const [emailError, setEmailError] = useState<string | null>(null);
	const mutation = useForgotPasswordMutation();

	function validate(): boolean {
		if (!email) setEmailError("L'email est requis");
		else if (!EMAIL_PATTERN.test(email)) setEmailError('Saisissez un email valide');
		else {
			setEmailError(null);
			return true;
		}
		return false;
	}

	function sendCode() {
		if (!validate()) return;
		mutation.mutate(email, {
			onSuccess: () => navigation.navigate('ResetPassword', { email }),
		});
	}

	return {
		email,
		changeEmail: text => {
			setEmail(text);
			setEmailError(null);
		},
		emailError,
		sendCode,
		isSending: mutation.isPending,
		error: mutation.error
			? apiErrorMessage(mutation.error, "Impossible d'envoyer le code de réinitialisation")
			: null,
		goToLogin: () => navigation.navigate('Login'),
	};
}
