import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { useDeletePlaylist } from '@/features/playlists/features/editor/shared/playlist-mutations/hooks/usePlaylistMutations';
import { confirmPlaylistDelete } from '@/features/playlists/features/editor/shared/delete-confirmation/confirmPlaylistDelete';
import type { PlaylistDetailScreen } from '@/features/playlists/features/editor/features/detail/types/detailScreenTypes';

export function useDeleteFlow(screen: PlaylistDetailScreen): () => void {
	const deletePlaylist = useDeletePlaylist();

	async function confirmDelete() {
		screen.markDeleting(true);
		try {
			await deletePlaylist.mutateAsync(screen.id);
			showSuccess('Playlist supprimée');
			screen.leaveDeleted();
		} catch (error) {
			screen.markDeleting(false);
			logger.error('[PlaylistDetailScreen] Delete playlist failed:', error);
			showError(apiErrorMessage(error, 'Impossible de supprimer la playlist'));
		}
	}

	return () => confirmPlaylistDelete(screen.playlist?.name ?? '', () => void confirmDelete());
}
