import { useState } from 'react';
import type { EmailField } from '@/features/user/features/auth/features/forgot-password/forgotPasswordTypes';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

function emailProblem(email: string): string | null {
	if (!email) return "L'email est requis";
	if (!EMAIL_PATTERN.test(email)) return 'Saisissez un email valide';
	return null;
}

export function useEmailField(initialEmail: string): EmailField {
	const [email, setEmail] = useState(initialEmail);
	const [emailError, setEmailError] = useState<string | null>(null);

	return {
		email,
		changeEmail: text => {
			setEmail(text);
			setEmailError(null);
		},
		emailError,
		validate: () => {
			const problem = emailProblem(email);
			setEmailError(problem);
			return problem === null;
		},
	};
}
