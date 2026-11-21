import { useState } from 'react';
import { useCodeInput } from '@/features/user/features/auth/shared/code-input/hooks/useCodeInput';
import { useVerifyCode } from '@/features/user/features/auth/features/email-verification/hooks/useVerifyCode';
import { useResendVerification } from '@/features/user/features/auth/features/email-verification/hooks/useResendVerification';
import type { EmailVerification } from '@/features/user/features/auth/features/email-verification/emailVerificationTypes';

export function useEmailVerification(userId: string, email: string): EmailVerification {
	const code = useCodeInput();
	const [error, setError] = useState<string | null>(null);
	const verification = useVerifyCode({ userId, email, code, reportError: setError });
	const resending = useResendVerification({ userId, email, code, reportError: setError });

	return {
		code,
		changeDigit: (index, text) => {
			const complete = code.changeDigit(index, text);
			if (complete) verification.verify(complete);
		},
		verify: () => verification.verify(),
		isVerifying: verification.isVerifying,
		resend: resending.resend,
		isResending: resending.isResending,
		cooldown: resending.cooldown,
		error,
		codeError: verification.codeError,
	};
}
