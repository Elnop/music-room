import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showSuccess } from '@/shared/theme/lib/toast';
import { CODE_LENGTH } from '@/features/user/features/auth/shared/code-input/codeInputConfig';
import {
	useForgotPasswordMutation,
	useResetPasswordMutation,
} from '@/features/user/features/auth/shared/password-reset/usePasswordResetMutations';
import { useResendResetCode } from '@/features/user/features/auth/features/reset-password/hooks/useResendResetCode';
import type {
	ResetPasswordNavigation,
	ResetRequest,
	ResetSubmission,
} from '@/features/user/features/auth/features/reset-password/resetPasswordTypes';

const BACK_TO_LOGIN_DELAY_MS = 1500;

function resetFailure(resetError: Error | null, forgotError: Error | null): string | null {
	if (resetError) return apiErrorMessage(resetError, 'Impossible de réinitialiser le mot de passe');
	if (forgotError) {
		return apiErrorMessage(forgotError, "Impossible d'envoyer le code de réinitialisation");
	}
	return null;
}

function backToLogin(navigation: ResetPasswordNavigation): void {
	showSuccess('Mot de passe réinitialisé avec succès');
	setTimeout(() => navigation.navigate('Login'), BACK_TO_LOGIN_DELAY_MS);
}

export function useResetSubmission(request: ResetRequest): ResetSubmission {
	const reset = useResetPasswordMutation();
	const forgot = useForgotPasswordMutation();
	const resendCode = useResendResetCode(request.email, forgot, reset.reset);

	function submit() {
		const { email, code, password } = request;
		const fullCode = code.digits.join('');
		if (fullCode.length !== CODE_LENGTH || !password.validate()) return;
		forgot.reset();
		reset.mutate(
			{ email, code: fullCode, password: password.newPassword.value },
			{ onSuccess: () => backToLogin(request.navigation) }
		);
	}

	return {
		submit,
		isLoading: reset.isPending || forgot.isPending,
		error: resetFailure(reset.error, forgot.error),
		resend: () => void resendCode.resend(),
		cooldown: resendCode.cooldown,
	};
}
