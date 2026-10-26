import { useCallback, useState } from 'react';
import { showAlert } from '@/shared/utils/alert';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { showError, showSuccess } from '@/shared/utils/toast';
import { useDeletePlaylist } from '@/features/playlists/hooks/usePlaylistMutations';
import type { DetailNavigation, PlaylistDetailScreen } from './usePlaylistDetailScreen';

interface OwnerActions {
	sheetVisible: boolean;
	openSheet: () => void;
	closeSheet: () => void;
	edit: () => void;
	sharing: () => void;
	/** Asks for confirmation, then deletes the playlist for all its members. */
	remove: () => void;
}

export function useOwnerActions(
	navigation: DetailNavigation,
	screen: PlaylistDetailScreen
): OwnerActions {
	const { id, playlist, markDeleting, leaveDeleted } = screen;
	const [sheetVisible, setSheetVisible] = useState(false);
	const deletePlaylist = useDeletePlaylist();

	const confirmDelete = async () => {
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
	};

	return {
		sheetVisible,
		openSheet: useCallback(() => setSheetVisible(true), []),
		closeSheet: () => setSheetVisible(false),
		edit: () => navigation.navigate('CreatePlaylist', { playlistId: id }),
		sharing: () => navigation.navigate('PlaylistSharing', { playlistId: id }),
		remove: () =>
			showAlert(
				'Supprimer la playlist ?',
				`« ${playlist?.name ?? ''} » sera supprimée pour tous ses membres. Cette action est définitive.`,
				[
					{ text: 'Annuler', style: 'cancel' },
					{ text: 'Supprimer', style: 'destructive', onPress: () => void confirmDelete() },
				]
			),
	};
}
