import { useState } from 'react';
import { Keyboard } from 'react-native';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showSuccess } from '@/shared/theme/lib/toast';
import { useCodeInput } from '@/features/user/features/auth/shared/code-input/useCodeInput';
import type { CodeInput } from '@/features/user/features/auth/shared/code-input/useCodeInput';
import { useCountdown } from '@/features/user/features/auth/shared/countdown/useCountdown';
import {
	useResendVerificationMutation,
	useVerifyEmailMutation,
} from '@/features/user/features/auth/shared/sign-in/hooks/useSignInMutations';

const RESEND_COOLDOWN_S = 60;

export type EmailVerification = {
	code: CodeInput;
	changeDigit: (index: number, text: string) => void;
	verify: () => void;
	isVerifying: boolean;
	resend: () => void;
	isResending: boolean;
	cooldown: number;
	error: string | null;
	codeError: string | null;
};

export function useEmailVerification(userId: string, email: string): EmailVerification {
	const code = useCodeInput();
	const cooldown = useCountdown();
	const verifyMutation = useVerifyEmailMutation();
	const resendMutation = useResendVerificationMutation();
	const [error, setError] = useState<string | null>(null);
	const [codeError, setCodeError] = useState<string | null>(null);

	function verify(fullCode = code.digits.join('')) {
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
	}

	function resend() {
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
	}

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
