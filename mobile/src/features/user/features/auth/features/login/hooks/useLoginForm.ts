import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ApiError } from '@/shared/backend/lib/api';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showWarning } from '@/shared/theme/lib/toast';
import { logger } from '@/shared/logging/logger';
import { loginSchema } from '@/features/user/features/auth/shared/sign-in/authSchemas';
import type { LoginInput } from '@/features/user/features/auth/shared/sign-in/types/authInputTypes';
import type { AuthStackParamList } from '@/features/user/features/auth/authTypes';
import { useLoginMutation } from '@/features/user/features/auth/shared/sign-in/hooks/useSignInMutations';
import { useFieldBinding } from '@/features/user/features/auth/shared/field-binding/useFieldBinding';
import { useFocusedErrorToast } from '@/features/user/features/auth/features/login/hooks/useFocusedErrorToast';
import type {
	EmailVerificationParams,
	LoginForm,
} from '@/features/user/features/auth/features/login/loginTypes';

const REDIRECT_DELAY_MS = 1500;

type LoginNavigation = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

function unverifiedEmail(error: unknown): EmailVerificationParams | null {
	const details =
		error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED'
			? (error.details as { userId?: string; email?: string } | undefined)
			: undefined;
	return details?.userId && details.email ? { userId: details.userId, email: details.email } : null;
}

function handleLoginError(
	error: unknown,
	navigation: LoginNavigation,
	reportError: (message: string) => void
): void {
	logger.error('[LoginScreen] Login error:', error);
	const params = unverifiedEmail(error);
	if (params) {
		showWarning('Email non vérifié. Redirection...');
		setTimeout(() => navigation.navigate('EmailVerification', params), REDIRECT_DELAY_MS);
		return;
	}
	reportError(apiErrorMessage(error, 'Connexion impossible, réessayez'));
}

export function useLoginForm(navigation: LoginNavigation): LoginForm {
	const form = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: '', password: '' },
	});
	const login = useLoginMutation();
	const reportError = useFocusedErrorToast();

	return {
		email: useFieldBinding(form.control, 'email'),
		password: useFieldBinding(form.control, 'password'),
		submit: form.handleSubmit(input =>
			login.mutate(input, { onError: error => handleLoginError(error, navigation, reportError) })
		),
		isSubmitting: login.isPending,
		reportError,
		goToForgotPassword: () =>
			navigation.navigate('ForgotPassword', { email: form.getValues('email').trim() }),
		goToRegister: () => navigation.navigate('Register'),
	};
}
