import { useState } from 'react';
import { useSession, setAvatarUrl } from '@/shared/services/authSession';
import { profileApi } from '@/features/profile/services/profileApi';
import { pickImage, type ImageSource } from '@/shared/utils/imagePicker';
import { prepareSquareImage } from '@/shared/utils/squareImage';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { showError, showSuccess } from '@/shared/utils/toast';

const PERMISSION_DENIED: Record<ImageSource, string> = {
	library: "Autorisez l'accès à vos photos dans les réglages pour choisir une photo de profil.",
	camera:
		"Autorisez l'accès à l'appareil photo dans les réglages pour prendre une photo de profil.",
};

export function useAvatarPicker() {
	const accessToken = useSession(s => s.accessToken);
	const [isUploading, setIsUploading] = useState(false);

	const pickAndUpload = async (source: ImageSource): Promise<void> => {
		if (!accessToken || isUploading) return;
		const asset = await pickImage(source, PERMISSION_DENIED[source]);
		if (!asset) return;

		setIsUploading(true);
		try {
			const uri = await prepareSquareImage(asset);
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
