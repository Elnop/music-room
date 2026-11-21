import type { EditProfileFieldConfig } from '@/features/user/features/profile/features/edit-profile/editProfileTypes';

export const PROFILE_LIMITS = {
	DISPLAY_NAME_MAX: 15,
	BIO_MAX: 300,
} as const;

export const DISPLAY_NAME_FIELD: EditProfileFieldConfig = {
	label: 'Nom affiché',
	max: PROFILE_LIMITS.DISPLAY_NAME_MAX,
	placeholder: 'Saisissez votre nom',
	autoCapitalize: 'words',
	returnKeyType: 'next',
};

export const BIO_FIELD: EditProfileFieldConfig = {
	label: 'Bio',
	max: PROFILE_LIMITS.BIO_MAX,
	placeholder: 'Parlez-nous de vous…',
	multiline: true,
	numberOfLines: 4,
	returnKeyType: 'done',
};
