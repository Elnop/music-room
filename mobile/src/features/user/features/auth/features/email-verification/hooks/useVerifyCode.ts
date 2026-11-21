import { useState } from 'react';
import { Keyboard } from 'react-native';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { CODE_LENGTH } from '@/features/user/features/auth/shared/code-input/codeInputConfig';
import { useVerifyEmailMutation } from '@/features/user/features/auth/shared/sign-in/hooks/useSignInMutations';
import type { VerificationRequest } from '@/features/user/features/auth/features/email-verification/emailVerificationTypes';

type VerifyCode = {
	verify: (fullCode?: string) => void;
	isVerifying: boolean;
	codeError: string | null;
};

export function useVerifyCode({ userId, code, reportError }: VerificationRequest): VerifyCode {
	const mutation = useVerifyEmailMutation();
	const [codeError, setCodeError] = useState<string | null>(null);

	function verify(fullCode = code.digits.join('')) {
		if (fullCode.length !== CODE_LENGTH) {
			setCodeError('Saisissez les 6 chiffres');
			return;
		}
		setCodeError(null);
		reportError(null);
		Keyboard.dismiss();
		mutation.mutate(
			{ userId, code: fullCode },
			{
				onError: failure => {
					reportError(apiErrorMessage(failure, 'Vérification impossible, réessayez'));
					code.reset();
				},
			}
		);
	}

	return { verify, isVerifying: mutation.isPending, codeError };
}
