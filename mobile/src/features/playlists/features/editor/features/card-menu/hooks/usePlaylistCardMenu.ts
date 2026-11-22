import type { PlanState } from '@/features/subscription/subscriptionTypes';
import { useCoverActions } from '@/features/playlists/features/editor/shared/playlist-mutations/hooks/useCoverActions';
import { confirmPlaylistDelete } from '@/features/playlists/features/editor/shared/delete-confirmation/confirmPlaylistDelete';
import { useCardMenuSelection } from '@/features/playlists/features/editor/features/card-menu/hooks/useCardMenuSelection';
import { useCardMenuDelete } from '@/features/playlists/features/editor/features/card-menu/hooks/useCardMenuDelete';
import type {
	CardMenuNavigation,
	PlaylistCardMenu,
} from '@/features/playlists/features/editor/features/card-menu/cardMenuTypes';

export function usePlaylistCardMenu(
	navigation: CardMenuNavigation,
	premium: Pick<PlanState, 'isPremium' | 'refetch'>,
): PlaylistCardMenu {
	const { playlist, ...selection } = useCardMenuSelection();
	const id = playlist?.id ?? '';
	const cover = useCoverActions(navigation, id, premium);
	const confirmDelete = useCardMenuDelete(id);

	return {
		...selection,
		sheet: playlist && {
			playlistName: playlist.name,
			hasCover: Boolean(playlist.coverUrl),
			coverLocked: !cover.isPremium,
			onEdit: () => navigation.navigate('CreatePlaylist', { playlistId: id }),
			onSharing: () => navigation.navigate('PlaylistSharing', { playlistId: id }),
			onDelete: () => confirmPlaylistDelete(playlist.name, () => void confirmDelete()),
			onChangeCover: cover.change,
			onRemoveCover: cover.remove,
		},
	};
}
