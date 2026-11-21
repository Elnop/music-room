import { useState } from 'react';
import { useSession } from '@/shared/backend/hooks/useSession';
import { setAvatarUrl } from '@/features/user/features/profile/shared/profile/lib/sessionActions';
import { profileApi } from '@/features/user/features/profile/shared/profile/lib/profileApi';
import { pickImage } from '@/shared/image-picker/pickImage';
import type { ImageSource } from '@/shared/image-picker/imagePickerTypes';
import { prepareSquareImage } from '@/shared/square-image/prepareSquareImage';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError, showSuccess } from '@/shared/theme/lib/toast';

const PERMISSION_DENIED: Record<ImageSource, string> = {
	library: "Autorisez l'accès à vos photos dans les réglages pour choisir une photo de profil.",
	camera:
		"Autorisez l'accès à l'appareil photo dans les réglages pour prendre une photo de profil.",
};

export function useAvatarPicker() {
	const accessToken = useSession(s => s.accessToken);
	const [isUploading, setIsUploading] = useState(false);

	async function pickAndUpload(source: ImageSource): Promise<void> {
		if (!accessToken || isUploading) return;
		const asset = await pickImage(source, () => showError(PERMISSION_DENIED[source]));
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
	}

	async function remove(): Promise<void> {
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
	}

	return { isUploading, pickAndUpload, remove };
}
