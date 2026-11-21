import type { FieldBinding } from '@/features/user/features/auth/shared/field-binding/fieldBindingTypes';

export type RegisterForm = {
	email: FieldBinding;
	username: FieldBinding;
	password: FieldBinding;
	submit: () => void;
	isSubmitting: boolean;
	goToLogin: () => void;
};
