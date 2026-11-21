import React from 'react';
import { Input } from '@/shared/theme/components/Input';
import type { NewPassword } from '@/features/user/features/auth/features/reset-password/resetPasswordTypes';

type NewPasswordFieldsProps = {
	password: NewPassword;
	disabled: boolean;
	onEnter?: () => void;
};

export function NewPasswordFields({ password, disabled, onEnter }: NewPasswordFieldsProps) {
	return (
		<>
			<Input
				label="Nouveau mot de passe"
				{...password.newPassword}
				placeholder="Saisissez le nouveau mot de passe"
				secureTextEntry
				autoCapitalize="none"
				editable={!disabled}
			/>
			<Input
				label="Confirmation"
				{...password.confirmation}
				placeholder="Saisissez-le à nouveau"
				secureTextEntry
				autoCapitalize="none"
				editable={!disabled}
				onEnter={onEnter}
			/>
		</>
	);
}
