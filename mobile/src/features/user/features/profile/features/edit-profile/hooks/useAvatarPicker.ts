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

const UPLOAD_MESSAGES = {
	success: 'Photo de profil mise à jour',
	failure: 'Impossible de changer la photo de profil',
};

const REMOVE_MESSAGES = {
	success: 'Photo de profil retirée',
	failure: 'Impossible de retirer la photo de profil',
};

export function useAvatarPicker() {
	const accessToken = useSession(s => s.accessToken);
	const [isUploading, setIsUploading] = useState(false);

	async function pickAndUpload(source: ImageSource): Promise<void> {
		if (!accessToken || isUploading) return;
		const asset = await pickImage(source, () => showError(PERMISSION_DENIED[source]));
		if (!asset) return;
		await changeAvatar(() => uploadAvatar(asset), UPLOAD_MESSAGES, setIsUploading);
	}

	async function remove(): Promise<void> {
		if (!accessToken || isUploading) return;
		await changeAvatar(removeAvatar, REMOVE_MESSAGES, setIsUploading);
	}

	return { isUploading, pickAndUpload, remove };
}

async function uploadAvatar(asset: Parameters<typeof prepareSquareImage>[0]): Promise<void> {
	const uri = await prepareSquareImage(asset);
	const { avatarUrl } = await profileApi.uploadAvatar(uri);
	await setAvatarUrl(avatarUrl);
}

async function removeAvatar(): Promise<void> {
	await profileApi.removeAvatar();
	await setAvatarUrl(null);
}

async function changeAvatar(
	change: () => Promise<void>,
	messages: typeof UPLOAD_MESSAGES,
	setIsUploading: (isUploading: boolean) => void
): Promise<void> {
	setIsUploading(true);
	try {
		await change();
		showSuccess(messages.success);
	} catch (error) {
		showError(apiErrorMessage(error, messages.failure));
	} finally {
		setIsUploading(false);
	}
}
