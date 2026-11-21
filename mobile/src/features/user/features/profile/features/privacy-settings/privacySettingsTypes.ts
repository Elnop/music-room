import type { ProfilePrivacy, VisibilityLevel } from '@/shared/users/userTypes';

export type VisibilityField = keyof Pick<
	ProfilePrivacy,
	'avatarVisibility' | 'emailVisibility' | 'bioVisibility' | 'musicPreferencesVisibility'
>;

export type PrivacyEditing = {
	privacy: ProfilePrivacy | null;
	onVisibilityChange: (field: keyof ProfilePrivacy, value: VisibilityLevel) => void;
};

export type PrivacySave = {
	isSaving: boolean;
	hasChanges: boolean;
	onSave: () => void;
};

export type PrivacyToggleConfig = {
	field: VisibilityField;
	label: string;
	description: string;
};
