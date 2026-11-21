import { useCallback, useState } from 'react';
import type { AlertButton } from 'react-native';
import { showAlert } from '@/shared/alerts/alert';
import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAvatarPicker } from '@/features/user/features/profile/features/edit-profile/hooks/useAvatarPicker';
import { useUpdateProfileMutation } from '@/features/user/features/profile/shared/profile/hooks/useProfileMutations';
import { updateProfileSchema } from '@/features/user/features/profile/features/edit-profile/profileSchema';
import type { UpdateProfileInput } from '@/features/user/features/profile/features/edit-profile/profileSchema';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useSession } from '@/shared/backend/lib/authSession';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError } from '@/shared/theme/lib/toast';
import type { UpdateProfileData } from '@/shared/users/user.types';

export function useEditProfile() {
	const { theme } = useTheme();
	const bottomPadding = useBottomPadding();
	const navigation = useNavigation();
	const user = useSession(s => s.user);

	const [error, setError] = useState<string | null>(null);
	const { isUploading, pickAndUpload, remove } = useAvatarPicker();
	const updateMutation = useUpdateProfileMutation();

	const openPhotoMenu = useCallback(() => {
		const buttons: AlertButton[] = [
			{ text: 'Galerie', onPress: () => void pickAndUpload('library') },
			{ text: 'Appareil photo', onPress: () => void pickAndUpload('camera') },
		];
		if (user?.avatarUrl) {
			buttons.push({
				text: 'Retirer la photo',
				style: 'destructive',
				onPress: () => void remove(),
			});
		}
		buttons.push({ text: 'Annuler', style: 'cancel' });
		showAlert('Photo de profil', 'Choisissez une nouvelle photo.', buttons);
	}, [pickAndUpload, remove, user?.avatarUrl]);

	const {
		control,
		handleSubmit,
		formState: { errors, isDirty },
	} = useForm<UpdateProfileInput>({
		resolver: zodResolver(updateProfileSchema),
		defaultValues: {
			displayName: user?.displayName || user?.username || '',
			bio: user?.bio || '',
		},
	});

	const onSubmit = useCallback(
		async (data: UpdateProfileInput) => {
			if (!user) {
				showError('Non authentifié');
				return;
			}

			setError(null);

			try {
				const updateData: Partial<UpdateProfileData> = {};
				const trimmedDisplayName = data.displayName.trim();
				if (trimmedDisplayName) {
					updateData.displayName = trimmedDisplayName;
				}
				if (data.bio !== undefined) {
					updateData.bio = data.bio.trim();
				}

				await updateMutation.mutateAsync(updateData);
				navigation.goBack();
			} catch (err) {
				const errorMessage = apiErrorMessage(err, 'Impossible de mettre à jour le profil');
				setError(errorMessage);
				showError(errorMessage);
			}
		},
		[navigation, updateMutation, user]
	);

	return {
		theme,
		bottomPadding,
		user,
		error,
		isUploading,
		isLoading: updateMutation.isPending,
		isDirty,
		control,
		errors,
		openPhotoMenu,
		onSubmit: handleSubmit(onSubmit),
		onCancel: () => navigation.goBack(),
	};
}
