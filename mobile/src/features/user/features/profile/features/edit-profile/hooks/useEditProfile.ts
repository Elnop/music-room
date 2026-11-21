import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useSession } from '@/shared/backend/hooks/useSession';
import { useEditProfileForm } from '@/features/user/features/profile/features/edit-profile/hooks/useEditProfileForm';
import { usePhotoMenu } from '@/features/user/features/profile/features/edit-profile/hooks/usePhotoMenu';

export function useEditProfile() {
	const bottomPadding = useBottomPadding();
	const user = useSession(s => s.user);
	const photoMenu = usePhotoMenu(Boolean(user?.avatarUrl));
	const form = useEditProfileForm(user);

	return {
		bottomPadding,
		form,
		photo: {
			user,
			isUploading: photoMenu.isUploading,
			isLoading: form.isLoading,
			onOpenMenu: photoMenu.openPhotoMenu,
		},
	};
}
