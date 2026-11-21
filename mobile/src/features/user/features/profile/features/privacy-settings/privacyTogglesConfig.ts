import type { PrivacyToggleConfig } from '@/features/user/features/profile/features/privacy-settings/privacySettingsTypes';

export const PRIVACY_TOGGLES: PrivacyToggleConfig[] = [
	{
		field: 'avatarVisibility',
		label: 'Photo de profil',
		description: 'Qui peut voir votre photo',
	},
	{
		field: 'emailVisibility',
		label: 'Adresse email',
		description: 'Qui peut voir votre email',
	},
	{
		field: 'bioVisibility',
		label: 'Bio',
		description: 'Qui peut voir votre bio',
	},
	{
		field: 'musicPreferencesVisibility',
		label: 'Préférences musicales',
		description: 'Qui peut voir vos genres préférés',
	},
];

export const VISIBILITY_OPTIONS = ['public', 'friends_only', 'private'] as const;
