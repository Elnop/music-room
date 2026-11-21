import type { CodeInputState } from '@/features/user/features/auth/shared/code-input/codeInputTypes';

export type EmailVerification = {
	code: CodeInputState;
	changeDigit: (index: number, text: string) => void;
	verify: () => void;
	isVerifying: boolean;
	resend: () => void;
	isResending: boolean;
	cooldown: number;
	error: string | null;
	codeError: string | null;
};

export type VerificationRequest = {
	userId: string;
	email: string;
	code: CodeInputState;
	reportError: (message: string | null) => void;
};
