import React from 'react';
import { useEditProfile } from '@/features/user/features/profile/features/edit-profile/hooks/useEditProfile';
import { EditProfileView } from '@/features/user/features/profile/features/edit-profile/components/presenters/EditProfileView';

export function EditProfileContainer() {
	const editProfile = useEditProfile();

	return (
		<EditProfileView
			bottomPadding={editProfile.bottomPadding}
			photo={editProfile.photo}
			form={editProfile.form}
		/>
	);
}
