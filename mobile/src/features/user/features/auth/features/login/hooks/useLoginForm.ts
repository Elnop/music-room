import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ApiError } from '@/shared/backend/lib/api';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showWarning } from '@/shared/theme/lib/toast';
import { logger } from '@/shared/logging/logger';
import { loginSchema } from '@/features/user/features/auth/shared/sign-in/lib/validators';
import type { LoginInput } from '@/features/user/features/auth/shared/sign-in/lib/validators';
import type { AuthStackParamList } from '@/features/user/features/auth/types';
import { useLoginMutation } from '@/features/user/features/auth/shared/sign-in/hooks/useSignInMutations';
import { useFieldBinding } from '@/features/user/features/auth/shared/field-binding/useFieldBinding';
import type { FieldBinding } from '@/features/user/features/auth/shared/field-binding/useFieldBinding';
import { useFocusedErrorToast } from '@/features/user/features/auth/features/login/hooks/useFocusedErrorToast';

const REDIRECT_DELAY_MS = 1500;

type LoginForm = {
	email: FieldBinding;
	password: FieldBinding;
	submit: () => void;
	isSubmitting: boolean;
	reportError: (message: string) => void;
	goToForgotPassword: () => void;
	goToRegister: () => void;
};

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

	function onError(error: unknown) {
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
	}

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
