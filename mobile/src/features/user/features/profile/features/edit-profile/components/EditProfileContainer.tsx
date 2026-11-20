import React from 'react';
import { useEditProfile } from '@/features/user/features/profile/features/edit-profile/hooks/useEditProfile';
import { EditProfileView } from '@/features/user/features/profile/features/edit-profile/components/presenters/EditProfileView';

export function EditProfileContainer() {
	const {
		theme,
		bottomPadding,
		user,
		error,
		isUploading,
		isLoading,
		isDirty,
		control,
		errors,
		openPhotoMenu,
		onSubmit,
		onCancel,
	} = useEditProfile();

	return (
		<EditProfileView
			theme={theme}
			bottomPadding={bottomPadding}
			user={user}
			error={error}
			isUploading={isUploading}
			isLoading={isLoading}
			isDirty={isDirty}
			control={control}
			errors={errors}
			onOpenPhotoMenu={openPhotoMenu}
			onSubmit={onSubmit}
			onCancel={onCancel}
		/>
	);
}
