import { showWarning } from '@/shared/theme/lib/toast';
import { openEditWarning } from '@/features/playlists/features/editor/features/sharing/lib/sharingTexts';
import { useSharingUpdate } from '@/features/playlists/features/editor/features/sharing/hooks/useSharingUpdate';
import type {
	SharingMode,
	SharingSettings,
} from '@/features/playlists/features/editor/features/sharing/sharingTypes';

export function useSharingSettings(
	id: string,
	mode: SharingMode,
	loaded: boolean
): SharingSettings {
	const { isUpdating, apply } = useSharingUpdate(id);
	const { isPrivate, isEditRestricted } = mode;

	return {
		isUpdating,
		toggleVisibility: () => {
			if (isUpdating || !loaded) return;
			if (isPrivate) showWarning('Playlist publique : visible par tous');
			void apply({ visibility: isPrivate ? 'public' : 'private' }, 'Failed to update visibility');
		},
		toggleEditMode: () => {
			if (isUpdating || !loaded) return;
			if (isEditRestricted) showWarning(openEditWarning(isPrivate));
			void apply(
				{ editMode: isEditRestricted ? 'open' : 'restricted' },
				'Failed to update edit mode'
			);
		},
	};
}
