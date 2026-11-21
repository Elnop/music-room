import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { useRemoveTrack } from '@/features/playlists/features/editor/shared/track-edits/useTrackEdits';

export function useTrackDelete(id: string, canEdit: boolean): (trackId: string) => Promise<void> {
	const removeTrack = useRemoveTrack();

	return async function deleteTrack(trackId: string) {
		if (!canEdit) {
			showError('Vous ne pouvez pas éditer cette playlist');
			return;
		}
		try {
			await removeTrack.mutateAsync({ playlistId: id, trackId });
			showSuccess('Titre supprimé');
		} catch (error) {
			logger.error('[PlaylistDetailScreen] Remove track failed:', error);
			showError(apiErrorMessage(error, 'Impossible de supprimer le titre'));
		}
	};
}
