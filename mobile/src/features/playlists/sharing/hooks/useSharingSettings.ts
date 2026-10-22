import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { showError, showWarning } from '@/shared/utils/toast';
import { useUpdatePlaylist } from '@/features/playlists/hooks/usePlaylistMutations';
import { refreshPlaylist } from '@/features/playlists/utils/playlistCache';
import type { PlaylistInput } from '@/features/playlists/validators';
import type { SharingMode } from '@/features/playlists/utils/sharingTexts';

export interface SharingSettings {
	isUpdating: boolean;
	toggleVisibility: () => void;
	toggleEditMode: () => void;
}

/** The visibility and edit-mode switches; opening a playlist up warns first. */
export function useSharingSettings(
	id: string,
	mode: SharingMode,
	loaded: boolean
): SharingSettings {
	const client = useQueryClient();
	const update = useUpdatePlaylist();
	const [isUpdating, setIsUpdating] = useState(false);
	const { isPrivate, isEditRestricted } = mode;

	const apply = async (changes: Partial<PlaylistInput>, failure: string) => {
		setIsUpdating(true);
		try {
			await update.mutateAsync({ id, changes });
			await refreshPlaylist(client, id);
		} catch (error) {
			logger.error(`[PlaylistSharing] ${failure}:`, error);
			showError(
				apiErrorMessage(
					error,
					changes.visibility
						? 'Impossible de changer la visibilité'
						: 'Impossible de changer le mode édition'
				)
			);
		} finally {
			setIsUpdating(false);
		}
	};

	return {
		isUpdating,
		toggleVisibility: () => {
			if (isUpdating || !loaded) return;
			if (isPrivate) showWarning('Playlist publique : visible par tous');
			void apply({ visibility: isPrivate ? 'public' : 'private' }, 'Failed to update visibility');
		},
		toggleEditMode: () => {
			if (isUpdating || !loaded) return;
			if (isEditRestricted) {
				showWarning(isPrivate ? 'Tous les membres pourront éditer' : 'Tout le monde pourra éditer');
			}
			void apply(
				{ editMode: isEditRestricted ? 'open' : 'restricted' },
				'Failed to update edit mode'
			);
		},
	};
}
