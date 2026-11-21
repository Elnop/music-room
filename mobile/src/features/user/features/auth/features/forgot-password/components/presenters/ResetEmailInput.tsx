import React from 'react';
import { Input } from '@/shared/theme/components/Input';
import type { ForgotPassword } from '@/features/user/features/auth/features/forgot-password/forgotPasswordTypes';

type ResetEmailInputProps = {
	form: ForgotPassword;
};

export function ResetEmailInput({ form }: ResetEmailInputProps) {
	return (
		<Input
			label="Email"
			value={form.email}
			onChangeText={form.changeEmail}
			placeholder="vous@exemple.com"
			keyboardType="email-address"
			autoCapitalize="none"
			autoComplete="email"
			error={form.emailError ?? undefined}
			editable={!form.isSending}
			onEnter={form.email && !form.isSending ? form.sendCode : undefined}
		/>
	);
}
