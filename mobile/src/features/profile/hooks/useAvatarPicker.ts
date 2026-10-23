import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useSession, setAvatarUrl } from '@/shared/services/authSession';
import { profileApi } from '@/features/profile/services/profileApi';
import { prepareAvatar } from '@/features/profile/utils/avatarImage';
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

async function ensurePermission(source: AvatarSource): Promise<boolean> {
	const { granted } =
		source === 'camera'
			? await ImagePicker.requestCameraPermissionsAsync()
			: await ImagePicker.requestMediaLibraryPermissionsAsync();
	if (!granted) showError(PERMISSION_DENIED[source]);
	return granted;
}

export function useAvatarPicker() {
	const accessToken = useSession(s => s.accessToken);
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
			const { avatarUrl } = await profileApi.uploadAvatar(uri, accessToken);
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
