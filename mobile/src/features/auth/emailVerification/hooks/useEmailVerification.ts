import { useState } from 'react';
import { Keyboard } from 'react-native';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { showSuccess } from '@/shared/utils/toast';
import { useCodeInput, type CodeInput } from '@/features/auth/code/hooks/useCodeInput';
import { useCountdown } from '@/features/auth/code/hooks/useCountdown';
import {
	useResendVerificationMutation,
	useVerifyEmailMutation,
} from '@/features/auth/hooks/useSignInMutations';

/** Wait before another code may be sent, in seconds. */
const RESEND_COOLDOWN_S = 60;

export interface EmailVerification {
	code: CodeInput;
	/** Applies a box's text; a complete code is verified at once. */
	changeDigit: (index: number, text: string) => void;
	verify: () => void;
	isVerifying: boolean;
	resend: () => void;
	isResending: boolean;
	/** Seconds before the code may be sent again. */
	cooldown: number;
	/** The last verify or resend failure, or a code that is too short. */
	error: string | null;
	codeError: string | null;
}

/** A valid code opens the session; a wrong one empties the boxes. */
export function useEmailVerification(userId: string, email: string): EmailVerification {
	const code = useCodeInput();
	const cooldown = useCountdown();
	const verifyMutation = useVerifyEmailMutation();
	const resendMutation = useResendVerificationMutation();
	const [error, setError] = useState<string | null>(null);
	const [codeError, setCodeError] = useState<string | null>(null);

	const verify = (fullCode = code.digits.join('')) => {
		if (fullCode.length !== 6) {
			setCodeError('Saisissez les 6 chiffres');
			return;
		}
		setCodeError(null);
		setError(null);
		Keyboard.dismiss();
		verifyMutation.mutate(
			{ userId, code: fullCode },
			{
				onError: failure => {
					setError(apiErrorMessage(failure, 'Vérification impossible, réessayez'));
					code.reset();
				},
			}
		);
	};

	const resend = () => {
		if (cooldown.seconds > 0) return;
		setError(null);
		resendMutation.mutate(
			{ userId, email },
			{
				onSuccess: () => {
					cooldown.start(RESEND_COOLDOWN_S);
					showSuccess('Code renvoyé. Vérifiez votre email.');
				},
				onError: failure =>
					setError(apiErrorMessage(failure, "Impossible d'envoyer un nouveau code")),
			}
		);
	};

	return {
		code,
		changeDigit: (index, text) => {
			const complete = code.changeDigit(index, text);
			if (complete) verify(complete);
		},
		verify: () => verify(),
		isVerifying: verifyMutation.isPending,
		resend,
		isResending: resendMutation.isPending,
		cooldown: cooldown.seconds,
		error,
		codeError,
	};
}
