import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '@/features/user/features/auth/authTypes';
import type { CodeInputState } from '@/features/user/features/auth/shared/code-input/codeInputTypes';
import type { FieldBinding } from '@/features/user/features/auth/shared/field-binding/fieldBindingTypes';

export type ResetPasswordNavigation = NativeStackNavigationProp<
	AuthStackParamList,
	'ResetPassword'
>;

export type NewPassword = {
	newPassword: FieldBinding;
	confirmation: FieldBinding;
	validate: () => boolean;
	isFilled: boolean;
};

export type ResetSubmission = {
	submit: () => void;
	isLoading: boolean;
	error: string | null;
	resend: () => void;
	cooldown: number;
};

export type ResetPassword = ResetSubmission & {
	code: CodeInputState;
	password: NewPassword;
	canSubmit: boolean;
};

export type ResetRequest = {
	email: string;
	code: CodeInputState;
	password: NewPassword;
	navigation: ResetPasswordNavigation;
};
