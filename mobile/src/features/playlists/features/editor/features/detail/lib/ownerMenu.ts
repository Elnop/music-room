import type { PlaylistActionsMenu } from '@/features/playlists/features/editor/shared/action-sheet/actionSheetTypes';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import type { DetailPage } from '@/features/playlists/features/editor/features/detail/types/detailPageTypes';

export function ownerMenu(
	playlist: PlaylistWithTracks,
	{ owner, cover }: Pick<DetailPage, 'owner' | 'cover'>,
): PlaylistActionsMenu {
	return {
		playlistName: playlist.name,
		hasCover: Boolean(playlist.coverUrl),
		coverLocked: !cover.isPremium,
		onEdit: owner.edit,
		onSharing: owner.sharing,
		onDelete: owner.remove,
		onChangeCover: cover.change,
		onRemoveCover: cover.remove,
	};
}
