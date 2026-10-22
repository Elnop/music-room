import { useMutation } from '@tanstack/react-query';
import * as passwordApi from '@/features/auth/services/passwordApi';

/** Sends the reset code by email. */
export function useForgotPasswordMutation() {
	return useMutation({ mutationFn: (email: string) => passwordApi.forgotPassword(email) });
}

/** Sets the new password; the user then logs in with it. */
export function useResetPasswordMutation() {
	return useMutation({
		mutationFn: ({ email, code, password }: { email: string; code: string; password: string }) =>
			passwordApi.resetPassword(email, code, password),
	});
}
