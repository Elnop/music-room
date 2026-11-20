import React from 'react';
import { useEditProfile } from '@/features/profile/editProfile/useEditProfile';
import { EditProfileView } from '@/features/profile/editProfile/components/presenters/EditProfileView';

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
