import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showSuccess } from '@/shared/theme/lib/toast';
import { useCountdown } from '@/features/user/features/auth/shared/countdown/useCountdown';
import { useResendVerificationMutation } from '@/features/user/features/auth/shared/sign-in/hooks/useSignInMutations';
import type { VerificationRequest } from '@/features/user/features/auth/features/email-verification/emailVerificationTypes';

const RESEND_COOLDOWN_S = 60;

type ResendVerification = {
	resend: () => void;
	isResending: boolean;
	cooldown: number;
};

export function useResendVerification({
	userId,
	email,
	reportError,
}: VerificationRequest): ResendVerification {
	const mutation = useResendVerificationMutation();
	const cooldown = useCountdown();

	function resend() {
		if (cooldown.seconds > 0) return;
		reportError(null);
		mutation.mutate(
			{ userId, email },
			{
				onSuccess: () => {
					cooldown.start(RESEND_COOLDOWN_S);
					showSuccess('Code renvoyé. Vérifiez votre email.');
				},
				onError: (failure) =>
					reportError(apiErrorMessage(failure, "Impossible d'envoyer un nouveau code")),
			},
		);
	}

	return { resend, isResending: mutation.isPending, cooldown: cooldown.seconds };
}
