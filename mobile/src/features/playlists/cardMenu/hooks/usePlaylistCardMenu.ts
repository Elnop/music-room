import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { queryKeys } from '@/shared/query/keys';
import { useSession } from '@/shared/services/authSession';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { showError, showSuccess } from '@/shared/utils/toast';
import { useCoverActions } from '@/features/playlists/detail/hooks/useCoverActions';
import { useDeletePlaylist } from '@/features/playlists/hooks/usePlaylistMutations';
import { confirmPlaylistDelete } from '@/features/playlists/utils/confirmPlaylistDelete';
import { forgetPlaylist } from '@/features/playlists/utils/playlistCache';
import type { Playlist, PlaylistStackParamList } from '@/features/playlists/types';

export interface PlaylistCardMenu {
	visible: boolean;
	/** The last playlist, still rendered while the menu closes. */
	playlist: Playlist | null;
	/** Only the owner's playlists have a menu, as on the detail screen; the others keep the browser's. */
	actionsFor: (playlist: Playlist) => (() => void) | undefined;
	close: () => void;
	edit: () => void;
	sharing: () => void;
	remove: () => void;
	coverLocked: boolean;
	changeCover: () => void;
	removeCover: () => void;
}

/** The detail screen's « ⋯ » menu, opened from a playlist card. */
export function usePlaylistCardMenu(
	navigation: Pick<NativeStackNavigationProp<PlaylistStackParamList>, 'navigate' | 'getParent'>
): PlaylistCardMenu {
	const client = useQueryClient();
	const userId = useSession(session => session.user?.id);
	const [playlist, setPlaylist] = useState<Playlist | null>(null);
	const [visible, setVisible] = useState(false);
	const id = playlist?.id ?? '';
	const cover = useCoverActions(navigation, id, playlist !== null);
	const deletePlaylist = useDeletePlaylist();

	const confirmDelete = async () => {
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

	return {
		visible,
		playlist,
		actionsFor: target =>
			!!userId && target.ownerId === userId
				? () => {
						setPlaylist(target);
						setVisible(true);
					}
				: undefined,
		close: () => setVisible(false),
		edit: () => navigation.navigate('CreatePlaylist', { playlistId: id }),
		sharing: () => navigation.navigate('PlaylistSharing', { playlistId: id }),
		remove: () => confirmPlaylistDelete(playlist?.name ?? '', () => void confirmDelete()),
		coverLocked: !cover.isPremium,
		changeCover: cover.change,
		removeCover: cover.remove,
	};
}
