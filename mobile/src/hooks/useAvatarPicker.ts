import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store/authStore';
import { profileApi } from '@/services/profileApi';
import { prepareAvatar } from '@/utils/avatarImage';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { showError, showSuccess } from '@/shared/utils/toast';

type AvatarSource = 'library' | 'camera';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
	mediaTypes: ['images'],
	allowsEditing: true,
	aspect: [1, 1],
	quality: 1,
};

const PERMISSION_DENIED: Record<AvatarSource, string> = {
	library: "Autorisez l'accès à vos photos dans les réglages pour choisir une photo de profil.",
	camera:
		"Autorisez l'accès à l'appareil photo dans les réglages pour prendre une photo de profil.",
};

/** Asks for the source's permission; false (with a French message) when refused. */
async function ensurePermission(source: AvatarSource): Promise<boolean> {
	const { granted } =
		source === 'camera'
			? await ImagePicker.requestCameraPermissionsAsync()
			: await ImagePicker.requestMediaLibraryPermissionsAsync();
	if (!granted) showError(PERMISSION_DENIED[source]);
	return granted;
}

/**
 * Change or remove the signed-in user's profile photo (#351): pick from the
 * gallery or the camera, crop square, resize to 512 px JPEG, upload, then
 * update `user.avatarUrl` in the auth store so every Avatar shows it.
 */
export function useAvatarPicker() {
	const { accessToken, setAvatarUrl } = useAuthStore();
	const [isUploading, setIsUploading] = useState(false);

	const pickAndUpload = async (source: AvatarSource): Promise<void> => {
		if (!accessToken || isUploading) return;
		if (!(await ensurePermission(source))) return;

		const result =
			source === 'camera'
				? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
				: await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
		const asset = result.assets?.[0];
		if (result.canceled || !asset) return;

		setIsUploading(true);
		try {
			const uri = await prepareAvatar(asset);
			const { avatarUrl } = await profileApi.uploadAvatar(accessToken, uri);
			await setAvatarUrl(avatarUrl);
			showSuccess('Photo de profil mise à jour');
		} catch (error) {
			showError(apiErrorMessage(error, 'Impossible de changer la photo de profil'));
		} finally {
			setIsUploading(false);
		}
	};

	const remove = async (): Promise<void> => {
		if (!accessToken || isUploading) return;

		setIsUploading(true);
		try {
			await profileApi.removeAvatar(accessToken);
			await setAvatarUrl(null);
			showSuccess('Photo de profil retirée');
		} catch (error) {
			showError(apiErrorMessage(error, 'Impossible de retirer la photo de profil'));
		} finally {
			setIsUploading(false);
		}
	};

	return { isUploading, pickAndUpload, remove };
}
