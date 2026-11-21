import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError } from '@/shared/theme/lib/toast';
import { logger } from '@/shared/logging/logger';
import { registerSchema } from '@/features/user/features/auth/shared/sign-in/authSchemas';
import type { RegisterInput } from '@/features/user/features/auth/shared/sign-in/types/authInputTypes';
import type { AuthStackParamList, RegisterResult } from '@/features/user/features/auth/authTypes';
import { useRegisterMutation } from '@/features/user/features/auth/shared/sign-in/hooks/useSignInMutations';
import { useFieldBinding } from '@/features/user/features/auth/shared/field-binding/useFieldBinding';
import type { RegisterForm } from '@/features/user/features/auth/features/register/registerTypes';

type RegisterNavigation = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

function registerCallbacks(navigation: RegisterNavigation) {
	return {
		onSuccess: (result: RegisterResult) => {
			if (result.requiresVerification) {
				navigation.navigate('EmailVerification', {
					userId: result.userId,
					email: result.email,
				});
			}
		},
		onError: (error: unknown) => {
			logger.error('[RegisterScreen] Register error:', error);
			showError(apiErrorMessage(error, 'Inscription impossible, réessayez'));
		},
	};
}

export function useRegisterForm(navigation: RegisterNavigation): RegisterForm {
	const form = useForm<RegisterInput>({
		resolver: zodResolver(registerSchema),
		defaultValues: { email: '', password: '', username: '' },
	});
	const register = useRegisterMutation();

	return {
		email: useFieldBinding(form.control, 'email'),
		username: useFieldBinding(form.control, 'username'),
		password: useFieldBinding(form.control, 'password'),
		submit: form.handleSubmit(input => register.mutate(input, registerCallbacks(navigation))),
		isSubmitting: register.isPending,
		goToLogin: () => navigation.navigate('Login'),
	};
}
