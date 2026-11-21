import React from 'react';
import { Button } from '@/shared/theme/components/Button';
import { AuthFormFrame } from '@/features/user/features/auth/shared/auth-form/components/AuthFormFrame';
import { BoundFields } from '@/features/user/features/auth/shared/field-binding/BoundFields';
import { SocialSignInButtons } from '@/features/user/features/auth/shared/sign-in/components/SocialSignInButtons';
import type { SocialSignIn } from '@/features/user/features/auth/shared/sign-in/types/socialSignInTypes';
import { PasswordHint } from '@/features/user/features/auth/features/register/components/presenters/PasswordHint';
import {
	REGISTER_FIELDS,
	REGISTER_SETUP,
} from '@/features/user/features/auth/features/register/registerFormConfig';
import type { RegisterForm } from '@/features/user/features/auth/features/register/registerTypes';

type RegisterViewProps = {
	form: RegisterForm;
	social: SocialSignIn;
	bottomInset: number;
};

export function RegisterView({ form, social, bottomInset }: RegisterViewProps) {
	const isLoading = form.isSubmitting || social.isPending;

	return (
		<AuthFormFrame setup={REGISTER_SETUP} bottomInset={bottomInset} onFooterLink={form.goToLogin}>
			<BoundFields
				fields={REGISTER_FIELDS}
				bindings={form}
				onEnter={isLoading ? undefined : form.submit}
			/>
			<PasswordHint />
			<Button
				title="Créer un compte"
				onPress={form.submit}
				loading={isLoading}
				fullWidth
				variant="primary"
			/>
			<SocialSignInButtons social={social} disabled={isLoading} />
		</AuthFormFrame>
	);
}
