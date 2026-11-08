import { canResendResetCode } from '@/features/auth/services/passwordApi';
import { showError, showSuccess } from '@/shared/utils/toast';
import { useCountdown } from '@/features/auth/code/hooks/useCountdown';
import type { useForgotPasswordMutation } from '@/features/auth/hooks/usePasswordResetMutations';

const RESEND_COOLDOWN_S = 60;

interface ResendResetCode {
	resend: () => Promise<void>;
	cooldown: number;
}

export function useResendResetCode(
	email: string,
	forgotPassword: ReturnType<typeof useForgotPasswordMutation>,
	onSend: () => void
): ResendResetCode {
	const countdown = useCountdown();

	const resend = async () => {
		try {
			const status = await canResendResetCode(email);
			if (!status.canResend) {
				countdown.start(status.remainingSeconds);
				return;
			}
			onSend();
			await forgotPassword.mutateAsync(email);
			countdown.start(RESEND_COOLDOWN_S);
			showSuccess('Code renvoyé à votre email');
		} catch {
			showError('Échec envoi du code. Réessayez.');
		}
	};

	return { resend, cooldown: countdown.seconds };
}
