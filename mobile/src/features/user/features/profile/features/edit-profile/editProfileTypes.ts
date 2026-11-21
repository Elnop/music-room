import type { Control, FieldErrors } from 'react-hook-form';
import type { z } from 'zod';
import type { updateProfileSchema } from '@/features/user/features/profile/features/edit-profile/profileSchemas';
import type { UserProfile } from '@/shared/users/userTypes';

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export type EditProfilePhotoState = {
	user: UserProfile | null;
	isUploading: boolean;
	isLoading: boolean;
	onOpenMenu: () => void;
};

export type EditProfileFormState = {
	control: Control<UpdateProfileInput>;
	errors: FieldErrors<UpdateProfileInput>;
	error: string | null;
	isLoading: boolean;
	isDirty: boolean;
	onSubmit: () => void;
	onCancel: () => void;
};

export type EditProfileFieldConfig = {
	label: string;
	max: number;
	placeholder: string;
	returnKeyType: 'next' | 'done';
	autoCapitalize?: 'words';
	multiline?: boolean;
	numberOfLines?: number;
	onEnter?: () => void;
};
