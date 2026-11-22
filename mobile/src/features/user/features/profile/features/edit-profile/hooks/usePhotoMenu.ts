import { useCallback } from 'react';
import type { AlertButton } from 'react-native';
import { showAlert } from '@/shared/alerts/showAlert';
import { useAvatarPicker } from '@/features/user/features/profile/features/edit-profile/hooks/useAvatarPicker';

type AvatarPicker = ReturnType<typeof useAvatarPicker>;

export function usePhotoMenu(hasAvatar: boolean) {
	const picker = useAvatarPicker();
	const { pickAndUpload, remove } = picker;

	const openPhotoMenu = useCallback(() => {
		showAlert(
			'Photo de profil',
			'Choisissez une nouvelle photo.',
			photoMenuButtons({ pickAndUpload, remove }, hasAvatar),
		);
	}, [pickAndUpload, remove, hasAvatar]);

	return { isUploading: picker.isUploading, openPhotoMenu };
}

function photoMenuButtons(
	picker: Pick<AvatarPicker, 'pickAndUpload' | 'remove'>,
	hasAvatar: boolean,
): AlertButton[] {
	const buttons: AlertButton[] = [
		{ text: 'Galerie', onPress: () => void picker.pickAndUpload('library') },
		{ text: 'Appareil photo', onPress: () => void picker.pickAndUpload('camera') },
	];
	if (hasAvatar) {
		buttons.push({
			text: 'Retirer la photo',
			style: 'destructive',
			onPress: () => void picker.remove(),
		});
	}
	buttons.push({ text: 'Annuler', style: 'cancel' });
	return buttons;
}
