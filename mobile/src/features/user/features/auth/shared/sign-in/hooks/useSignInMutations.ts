import { useMutation } from '@tanstack/react-query';
import * as signIn from '@/features/user/features/auth/shared/sign-in/lib/signIn';
import * as authApi from '@/features/user/features/auth/shared/sign-in/lib/authApi';
import type { RegisterInput } from '@/features/user/features/auth/shared/sign-in/lib/validators';

export function useLoginMutation() {
	return useMutation({ mutationFn: signIn.login });
}

export function useRegisterMutation() {
	return useMutation({ mutationFn: (input: RegisterInput) => signIn.register(input) });
}

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
