import { useState } from 'react';
import { newPasswordError } from '@/features/user/features/auth/features/reset-password/newPasswordError';
import type { NewPassword } from '@/features/user/features/auth/features/reset-password/resetPasswordTypes';

type PasswordFields = {
	newPassword: string;
	confirmation: string;
	passwordError: string | null;
};

const EMPTY_FIELDS: PasswordFields = { newPassword: '', confirmation: '', passwordError: null };

export function useNewPassword(): NewPassword {
	const [fields, setFields] = useState<PasswordFields>(EMPTY_FIELDS);

	function change(key: 'newPassword' | 'confirmation') {
		return (text: string) =>
			setFields(current => ({ ...current, [key]: text, passwordError: null }));
	}

	return {
		newPassword: {
			value: fields.newPassword,
			onChangeText: change('newPassword'),
			error: fields.passwordError ?? undefined,
		},
		confirmation: { value: fields.confirmation, onChangeText: change('confirmation') },
		validate: () => {
			const invalid = newPasswordError(fields.newPassword, fields.confirmation);
			setFields(current => ({ ...current, passwordError: invalid }));
			return invalid === null;
		},
		isFilled: Boolean(fields.newPassword) && Boolean(fields.confirmation),
	};
}
