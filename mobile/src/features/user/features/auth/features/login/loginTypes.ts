import type { FieldBinding } from '@/features/user/features/auth/shared/field-binding/fieldBindingTypes';

export type LoginForm = {
	email: FieldBinding;
	password: FieldBinding;
	submit: () => void;
	isSubmitting: boolean;
	reportError: (message: string) => void;
	goToForgotPassword: () => void;
	goToRegister: () => void;
};

export type EmailVerificationParams = {
	userId: string;
	email: string;
};
