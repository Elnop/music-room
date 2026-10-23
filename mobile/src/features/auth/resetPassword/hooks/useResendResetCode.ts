import { canResendResetCode } from '@/features/auth/services/passwordApi';
import { showError, showSuccess } from '@/shared/utils/toast';
import { useCountdown } from '@/features/auth/code/hooks/useCountdown';
import type { useForgotPasswordMutation } from '@/features/auth/hooks/usePasswordResetMutations';

/** Wait before another code may be sent, in seconds. */
const RESEND_COOLDOWN_S = 60;

interface ResendResetCode {
	resend: () => Promise<void>;
	/** Seconds before the code may be sent again; 0 when it may. */
	cooldown: number;
}

/** Asks the backend whether a code may be sent now, then sends it through `forgotPassword`. */
export function useResendResetCode(
	email: string,
	forgotPassword: ReturnType<typeof useForgotPasswordMutation>,
	/** Called when a code is about to be sent: the last failure is dropped. */
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
