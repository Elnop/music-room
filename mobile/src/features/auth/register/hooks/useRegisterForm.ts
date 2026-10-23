import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { showError } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';
import { registerSchema, type RegisterInput } from '@/features/auth/validators';
import type { AuthStackParamList } from '@/features/auth/types';
import { useRegisterMutation } from '@/features/auth/hooks/useSignInMutations';
import { useFieldBinding, type FieldBinding } from '@/features/auth/form/hooks/useFieldBinding';

interface RegisterForm {
	email: FieldBinding;
	username: FieldBinding;
	password: FieldBinding;
	submit: () => void;
	isSubmitting: boolean;
	goToLogin: () => void;
}

/** An account that must verify its email goes to the code screen; RootNavigator shows the app otherwise. */
export function useRegisterForm(
	navigation: NativeStackNavigationProp<AuthStackParamList, 'Register'>
): RegisterForm {
	const { control, handleSubmit } = useForm<RegisterInput>({
		resolver: zodResolver(registerSchema),
		defaultValues: { email: '', password: '', username: '' },
	});
	const email = useFieldBinding(control, 'email');
	const username = useFieldBinding(control, 'username');
	const password = useFieldBinding(control, 'password');

	const register = useRegisterMutation();

	const submit = handleSubmit(input =>
		register.mutate(input, {
			onSuccess: result => {
				if (result.requiresVerification) {
					navigation.navigate('EmailVerification', {
						userId: result.userId,
						email: result.email,
					});
				}
			},
			onError: error => {
				logger.error('[RegisterScreen] Register error:', error);
				showError(apiErrorMessage(error, 'Inscription impossible, réessayez'));
			},
		})
	);

	return {
		email,
		username,
		password,
		submit,
		isSubmitting: register.isPending,
		goToLogin: () => navigation.navigate('Login'),
	};
}
