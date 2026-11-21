import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError } from '@/shared/theme/lib/toast';
import { useUpdatePlaylist } from '@/features/playlists/features/editor/shared/playlist-mutations/hooks/usePlaylistMutations';
import { refreshPlaylist } from '@/features/playlists/shared/playlist/lib/playlistCache';
import { settingFailureMessage } from '@/features/playlists/features/editor/features/sharing/lib/sharingTexts';
import type { PlaylistInput } from '@/features/playlists/features/editor/shared/playlist-mutations/types/playlistFormTypes';

export function useSharingUpdate(id: string) {
	const client = useQueryClient();
	const update = useUpdatePlaylist();
	const [isUpdating, setIsUpdating] = useState(false);

	async function apply(changes: Partial<PlaylistInput>, failure: string) {
		setIsUpdating(true);
		try {
			await update.mutateAsync({ id, changes });
			await refreshPlaylist(client, id);
		} catch (error) {
			logger.error(`[PlaylistSharing] ${failure}:`, error);
			showError(apiErrorMessage(error, settingFailureMessage(changes)));
		} finally {
			setIsUpdating(false);
		}
	}

	return { isUpdating, apply };
}
