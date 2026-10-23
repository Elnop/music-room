import { useMutation } from '@tanstack/react-query';
import * as passwordApi from '@/features/auth/services/passwordApi';

export function useForgotPasswordMutation() {
	return useMutation({ mutationFn: (email: string) => passwordApi.forgotPassword(email) });
}

/** The user then logs in with the new password. */
export function useResetPasswordMutation() {
	return useMutation({
		mutationFn: ({ email, code, password }: { email: string; code: string; password: string }) =>
			passwordApi.resetPassword(email, code, password),
	});
}
