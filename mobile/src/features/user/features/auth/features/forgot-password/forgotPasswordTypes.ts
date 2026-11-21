export type ForgotPassword = {
	email: string;
	changeEmail: (email: string) => void;
	emailError: string | null;
	sendCode: () => void;
	isSending: boolean;
	error: string | null;
	goToLogin: () => void;
};

export type EmailField = {
	email: string;
	changeEmail: (email: string) => void;
	emailError: string | null;
	validate: () => boolean;
};
