import React from 'react';
import { Button } from '@/shared/theme/components/Button';
import { AuthFormFrame } from '@/features/user/features/auth/shared/auth-form/components/AuthFormFrame';
import { BoundFields } from '@/features/user/features/auth/shared/field-binding/BoundFields';
import { SocialSignInButtons } from '@/features/user/features/auth/shared/sign-in/components/SocialSignInButtons';
import type { SocialSignIn } from '@/features/user/features/auth/shared/sign-in/types/socialSignInTypes';
import { ForgotPasswordLink } from '@/features/user/features/auth/features/login/components/presenters/ForgotPasswordLink';
import {
	LOGIN_FIELDS,
	LOGIN_SETUP,
} from '@/features/user/features/auth/features/login/loginFormConfig';
import type { LoginForm } from '@/features/user/features/auth/features/login/loginTypes';

type LoginViewProps = {
	form: LoginForm;
	social: SocialSignIn;
};

export function LoginView({ form, social }: LoginViewProps) {
	const isLoading = form.isSubmitting || social.isPending;

	return (
		<AuthFormFrame setup={LOGIN_SETUP} onFooterLink={form.goToRegister}>
			<BoundFields
				fields={LOGIN_FIELDS}
				bindings={form}
				onEnter={isLoading ? undefined : form.submit}
			/>
			<Button
				title="Se connecter"
				onPress={form.submit}
				loading={isLoading}
				fullWidth
				variant="primary"
			/>
			<ForgotPasswordLink onPress={form.goToForgotPassword} />
			<SocialSignInButtons social={social} disabled={isLoading} />
		</AuthFormFrame>
	);
}
