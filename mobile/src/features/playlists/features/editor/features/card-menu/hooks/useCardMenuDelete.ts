import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { useDeletePlaylist } from '@/features/playlists/features/editor/shared/playlist-mutations/hooks/usePlaylistMutations';
import { forgetPlaylist } from '@/features/playlists/features/editor/shared/playlist-mutations/lib/playlistCacheEdits';

export function useCardMenuDelete(id: string): () => Promise<void> {
	const client = useQueryClient();
	const deletePlaylist = useDeletePlaylist();

	return async () => {
		try {
			await deletePlaylist.mutateAsync(id);
			showSuccess('Playlist supprimée');
			forgetPlaylist(client, id);
			void client.invalidateQueries({ queryKey: queryKeys.playlists.public() });
		} catch (error) {
			logger.error('[PlaylistCardMenu] Delete playlist failed:', error);
			showError(apiErrorMessage(error, 'Impossible de supprimer la playlist'));
		}
	};
}
