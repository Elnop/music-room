import { useMutation } from '@tanstack/react-query';
import * as signIn from '@/features/auth/services/signIn';
import * as authApi from '@/features/auth/services/authApi';
import type { RegisterInput } from '@/features/auth/validators';

/** Email and password login; RootNavigator shows the app once the session opens. */
export function useLoginMutation() {
	return useMutation({ mutationFn: signIn.login });
}

export function useRegisterMutation() {
	return useMutation({ mutationFn: (input: RegisterInput) => signIn.register(input) });
}

/** Exchanges the code sent at registration for a session. */
export function useVerifyEmailMutation() {
	return useMutation({
		mutationFn: ({ userId, code }: { userId: string; code: string }) =>
			signIn.verifyEmail(userId, code),
	});
}

export function useResendVerificationMutation() {
	return useMutation({
		mutationFn: ({ userId, email }: { userId: string; email: string }) =>
			authApi.resendVerificationCode(userId, email),
	});
}
