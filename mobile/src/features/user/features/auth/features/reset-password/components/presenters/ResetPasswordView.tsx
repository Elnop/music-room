import React from 'react';
import { CodeInput } from '@/features/user/features/auth/shared/code-input/components/CodeInput';
import { PasswordScreenFrame } from '@/features/user/features/auth/shared/password-screen/components/PasswordScreenFrame';
import { NewPasswordFields } from '@/features/user/features/auth/features/reset-password/components/presenters/NewPasswordFields';
import { PasswordRequirements } from '@/features/user/features/auth/features/reset-password/components/presenters/PasswordRequirements';
import { ResetPasswordActions } from '@/features/user/features/auth/features/reset-password/components/presenters/ResetPasswordActions';
import type { ResetPassword } from '@/features/user/features/auth/features/reset-password/resetPasswordTypes';

type ResetPasswordViewProps = {
	email: string;
	form: ResetPassword;
};

export function ResetPasswordView({ email, form }: ResetPasswordViewProps) {
	return (
		<PasswordScreenFrame
			title="Nouveau mot de passe"
			subtitle="Saisissez le code à 6 chiffres envoyé à"
			emphasis={email}
			compactHeader
		>
			<CodeInput
				code={form.code}
				onChangeDigit={form.code.changeDigit}
				options={{ compact: true, editable: !form.isLoading }}
			/>
			<NewPasswordFields
				password={form.password}
				disabled={form.isLoading}
				onEnter={form.canSubmit ? form.submit : undefined}
			/>
			<PasswordRequirements />
			<ResetPasswordActions form={form} />
		</PasswordScreenFrame>
	);
}
