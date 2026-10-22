import { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import type { AuthStackParamList } from '@/features/auth/types';
import { useForgotPasswordMutation } from '@/features/auth/hooks/usePasswordResetMutations';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ForgotPassword {
	email: string;
	changeEmail: (email: string) => void;
	emailError: string | null;
	sendCode: () => void;
	isSending: boolean;
	/** The failure of the last request, until the next one. */
	error: string | null;
	goToLogin: () => void;
}

/** Asks for the reset code, then opens the new password screen. */
export function useForgotPassword(
	initialEmail: string,
	navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>
): ForgotPassword {
	const [email, setEmail] = useState(initialEmail);
	const [emailError, setEmailError] = useState<string | null>(null);
	const mutation = useForgotPasswordMutation();

	const validate = (): boolean => {
		if (!email) setEmailError("L'email est requis");
		else if (!EMAIL_PATTERN.test(email)) setEmailError('Saisissez un email valide');
		else {
			setEmailError(null);
			return true;
		}
		return false;
	};

	const sendCode = () => {
		if (!validate()) return;
		mutation.mutate(email, {
			onSuccess: () => navigation.navigate('ResetPassword', { email }),
		});
	};

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
