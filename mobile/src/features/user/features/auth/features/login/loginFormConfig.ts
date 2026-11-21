import type { AuthFormSetup } from '@/features/user/features/auth/shared/auth-form/authFormTypes';
import type { FieldSpec } from '@/features/user/features/auth/shared/field-binding/fieldBindingTypes';

export const LOGIN_FIELDS: readonly FieldSpec<'email' | 'password'>[] = [
	{
		name: 'email',
		label: 'Email',
		placeholder: 'demo@zumik.com',
		keyboardType: 'email-address',
	},
	{
		name: 'password',
		label: 'Mot de passe',
		placeholder: 'Saisissez votre mot de passe',
		secureTextEntry: true,
	},
];

export const LOGIN_SETUP: AuthFormSetup = {
	logoSize: 150,
	footer: {
		text: 'Pas encore de compte ? ',
		link: "S'inscrire",
	},
};
