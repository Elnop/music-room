import { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useUpdateProfileMutation } from '@/features/user/features/profile/shared/profile/hooks/useProfileMutations';
import type { UpdateProfileInput } from '@/features/user/features/profile/features/edit-profile/editProfileTypes';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError } from '@/shared/theme/lib/toast';
import type { UpdateProfileData, UserProfile } from '@/shared/users/userTypes';

type ProfileSave = {
	user: UserProfile | null;
	save: (data: Partial<UpdateProfileData>) => Promise<unknown>;
	onSaved: () => void;
	setError: (error: string | null) => void;
};

export function useProfileSubmit(user: UserProfile | null) {
	const navigation = useNavigation();
	const [error, setError] = useState<string | null>(null);
	const updateMutation = useUpdateProfileMutation();

	const submit = useCallback(
		(data: UpdateProfileInput) =>
			saveProfile(data, {
				user,
				save: updateMutation.mutateAsync,
				onSaved: () => navigation.goBack(),
				setError,
			}),
		[navigation, updateMutation, user],
	);

	return { error, submit, isLoading: updateMutation.isPending, cancel: () => navigation.goBack() };
}

async function saveProfile(data: UpdateProfileInput, profileSave: ProfileSave): Promise<void> {
	if (!profileSave.user) {
		showError('Non authentifié');
		return;
	}
	profileSave.setError(null);
	try {
		await profileSave.save(toUpdateProfileData(data));
		profileSave.onSaved();
	} catch (err) {
		const errorMessage = apiErrorMessage(err, 'Impossible de mettre à jour le profil');
		profileSave.setError(errorMessage);
		showError(errorMessage);
	}
}

function toUpdateProfileData(data: UpdateProfileInput): Partial<UpdateProfileData> {
	const updateData: Partial<UpdateProfileData> = {};
	const trimmedDisplayName = data.displayName.trim();
	if (trimmedDisplayName) {
		updateData.displayName = trimmedDisplayName;
	}
	if (data.bio !== undefined) {
		updateData.bio = data.bio.trim();
	}
	return updateData;
}
