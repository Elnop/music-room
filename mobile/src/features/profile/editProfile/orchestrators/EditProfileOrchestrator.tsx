import React from 'react';
import { useEditProfile } from '@/features/profile/editProfile/hooks/useEditProfile';
import { EditProfileView } from '@/features/profile/editProfile/presenters/EditProfileView';

export function EditProfileOrchestrator() {
	const {
		theme,
		playerHeight,
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
			playerHeight={playerHeight}
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
