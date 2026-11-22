import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import type { AuthStackParamList } from '@/features/user/features/auth/authTypes';
import { useForgotPasswordMutation } from '@/features/user/features/auth/shared/password-reset/usePasswordResetMutations';
import { useEmailField } from '@/features/user/features/auth/features/forgot-password/hooks/useEmailField';
import type { ForgotPassword } from '@/features/user/features/auth/features/forgot-password/forgotPasswordTypes';

function sendFailure(error: Error | null): string | null {
	return error ? apiErrorMessage(error, "Impossible d'envoyer le code de réinitialisation") : null;
}

export function useForgotPassword(
	initialEmail: string,
	navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>,
): ForgotPassword {
	const field = useEmailField(initialEmail);
	const mutation = useForgotPasswordMutation();

	function sendCode() {
		if (!field.validate()) return;
		mutation.mutate(field.email, {
			onSuccess: () => navigation.navigate('ResetPassword', { email: field.email }),
		});
	}

	return {
		email: field.email,
		changeEmail: field.changeEmail,
		emailError: field.emailError,
		sendCode,
		isSending: mutation.isPending,
		error: sendFailure(mutation.error),
		goToLogin: () => navigation.navigate('Login'),
	};
}
