import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { queryKeys } from '@/shared/query-keys/keys';
import { useSession } from '@/shared/backend/lib/authSession';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { useCoverActions } from '@/features/playlists/detail/hooks/useCoverActions';
import { useDeletePlaylist } from '@/features/playlists/hooks/usePlaylistMutations';
import { confirmPlaylistDelete } from '@/features/playlists/utils/confirmPlaylistDelete';
import { forgetPlaylist } from '@/features/playlists/utils/playlistCache';
import type { Playlist, PlaylistStackParamList } from '@/features/playlists/types';
import type { PlanState } from '@/features/subscription/lib/subscription';

export interface PlaylistCardMenu {
	visible: boolean;
	/** The last playlist, still rendered while the menu closes. */
	playlist: Playlist | null;
	/** Owner's playlists only; the others keep the browser's menu. */
	actionsFor: (playlist: Playlist) => (() => void) | undefined;
	close: () => void;
	edit: () => void;
	sharing: () => void;
	remove: () => void;
	coverLocked: boolean;
	changeCover: () => void;
	removeCover: () => void;
}

export function usePlaylistCardMenu(
	navigation: Pick<NativeStackNavigationProp<PlaylistStackParamList>, 'navigate' | 'getParent'>,
	premium: Pick<PlanState, 'isPremium' | 'refetch'>
): PlaylistCardMenu {
	const client = useQueryClient();
	const userId = useSession(session => session.user?.id);
	const [playlist, setPlaylist] = useState<Playlist | null>(null);
	const [visible, setVisible] = useState(false);
	const id = playlist?.id ?? '';
	const cover = useCoverActions(navigation, id, premium);
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
