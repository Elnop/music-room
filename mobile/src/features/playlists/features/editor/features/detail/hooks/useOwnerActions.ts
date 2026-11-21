import { useCallback, useState } from 'react';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { useDeletePlaylist } from '@/features/playlists/features/editor/shared/playlist-mutations/usePlaylistMutations';
import { confirmPlaylistDelete } from '@/features/playlists/features/editor/shared/delete-confirmation/confirmPlaylistDelete';
import type {
	DetailNavigation,
	PlaylistDetailScreen,
} from '@/features/playlists/features/editor/features/detail/hooks/usePlaylistDetailScreen';

type OwnerActions = {
	sheetVisible: boolean;
	openSheet: () => void;
	closeSheet: () => void;
	edit: () => void;
	sharing: () => void;
	remove: () => void;
};

export function useOwnerActions(
	navigation: DetailNavigation,
	screen: PlaylistDetailScreen
): OwnerActions {
	const { id, playlist, markDeleting, leaveDeleted } = screen;
	const [sheetVisible, setSheetVisible] = useState(false);
	const deletePlaylist = useDeletePlaylist();

	async function confirmDelete() {
		markDeleting(true);
		try {
			await deletePlaylist.mutateAsync(id);
			showSuccess('Playlist supprimée');
			leaveDeleted();
		} catch (error) {
			markDeleting(false);
			logger.error('[PlaylistDetailScreen] Delete playlist failed:', error);
			showError(apiErrorMessage(error, 'Impossible de supprimer la playlist'));
		}
	}

	return {
		sheetVisible,
		openSheet: useCallback(() => setSheetVisible(true), []),
		closeSheet: () => setSheetVisible(false),
		edit: () => navigation.navigate('CreatePlaylist', { playlistId: id }),
		sharing: () => navigation.navigate('PlaylistSharing', { playlistId: id }),
		remove: () => confirmPlaylistDelete(playlist?.name ?? '', () => void confirmDelete()),
	};
}
