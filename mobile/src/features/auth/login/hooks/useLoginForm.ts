import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ApiError } from '@/shared/services/api';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { showWarning } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';
import { loginSchema, type LoginInput } from '@/features/auth/validators';
import type { AuthStackParamList } from '@/features/auth/types';
import { useLoginMutation } from '@/features/auth/hooks/useSignInMutations';
import { useFieldBinding, type FieldBinding } from '@/features/auth/form/hooks/useFieldBinding';
import { useFocusedErrorToast } from '@/features/auth/form/hooks/useFocusedErrorToast';

/** Delay before an unverified account is sent to the code screen. */
const REDIRECT_DELAY_MS = 1500;

interface LoginForm {
	email: FieldBinding;
	password: FieldBinding;
	submit: () => void;
	isSubmitting: boolean;
	/** Shows an error toast once this screen is focused. */
	reportError: (message: string) => void;
	goToForgotPassword: () => void;
	goToRegister: () => void;
}

/**
 * The email and password form. A failure shows a toast while the screen is
 * focused (mutate callbacks never run after it unmounted); an account whose email
 * is not verified is sent to the code screen instead.
 */
export function useLoginForm(
	navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'>
): LoginForm {
	const { control, handleSubmit, getValues } = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: '', password: '' },
	});
	const email = useFieldBinding(control, 'email');
	const password = useFieldBinding(control, 'password');

	const login = useLoginMutation();
	const reportError = useFocusedErrorToast();

	const onError = (error: unknown) => {
		logger.error('[LoginScreen] Login error:', error);
		const details =
			error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED'
				? (error.details as { userId?: string; email?: string } | undefined)
				: undefined;

		if (details?.userId && details.email) {
			const params = { userId: details.userId, email: details.email };
			showWarning('Email non vérifié. Redirection...');
			setTimeout(() => navigation.navigate('EmailVerification', params), REDIRECT_DELAY_MS);
			return;
		}
		reportError(apiErrorMessage(error, 'Connexion impossible, réessayez'));
	};

	return {
		email,
		password,
		submit: handleSubmit(input => login.mutate(input, { onError })),
		isSubmitting: login.isPending,
		reportError,
		goToForgotPassword: () =>
			navigation.navigate('ForgotPassword', { email: getValues('email').trim() }),
		goToRegister: () => navigation.navigate('Register'),
	};
}
