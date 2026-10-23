import { useCallback, useState } from 'react';
import { Alert, type AlertButton } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAvatarPicker } from '@/features/profile/hooks/useAvatarPicker';
import { useUpdateProfileMutation } from '@/features/profile/hooks/useProfileMutations';
import { updateProfileSchema, type UpdateProfileInput } from '@/features/profile/types';
import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import { useSession } from '@/shared/services/authSession';
import { useTheme } from '@/shared/theme/ThemeContext';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { showError } from '@/shared/utils/toast';
import type { UpdateProfileData } from '@/types/user.types';

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
		Alert.alert('Photo de profil', 'Choisissez une nouvelle photo.', buttons);
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
