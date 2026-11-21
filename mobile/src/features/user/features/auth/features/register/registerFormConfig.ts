import type { AuthFormSetup } from '@/features/user/features/auth/shared/auth-form/authFormTypes';
import type { FieldSpec } from '@/features/user/features/auth/shared/field-binding/fieldBindingTypes';

export const REGISTER_FIELDS: readonly FieldSpec<'email' | 'username' | 'password'>[] = [
	{
		name: 'email',
		label: 'Email',
		placeholder: 'vous@exemple.com',
		keyboardType: 'email-address',
	},
	{
		name: 'username',
		label: "Nom d'utilisateur",
		placeholder: 'votre_pseudo',
	},
	{
		name: 'password',
		label: 'Mot de passe',
		placeholder: 'Choisissez un mot de passe robuste',
		secureTextEntry: true,
	},
];

export const REGISTER_SETUP: AuthFormSetup = {
	logoSize: 120,
	footer: {
		text: 'Déjà un compte ? ',
		link: 'Se connecter',
	},
};
