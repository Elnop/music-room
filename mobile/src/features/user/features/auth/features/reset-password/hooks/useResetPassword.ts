import { useEffect } from 'react';
import { useCodeInput } from '@/features/user/features/auth/shared/code-input/hooks/useCodeInput';
import { useNewPassword } from '@/features/user/features/auth/features/reset-password/hooks/useNewPassword';
import { useResetSubmission } from '@/features/user/features/auth/features/reset-password/hooks/useResetSubmission';
import type {
	ResetPassword,
	ResetPasswordNavigation,
} from '@/features/user/features/auth/features/reset-password/resetPasswordTypes';

export function useResetPassword(
	email: string,
	navigation: ResetPasswordNavigation,
): ResetPassword {
	const code = useCodeInput();
	const password = useNewPassword();
	const submission = useResetSubmission({ email, code, password, navigation });

	const { focusFirst } = code;
	useEffect(() => focusFirst(), [focusFirst]);

	return {
		...submission,
		code,
		password,
		canSubmit: !submission.isLoading && code.isComplete && password.isFilled,
	};
}
