import { useCallback, useState } from 'react';
import { useSession } from '@/shared/backend/hooks/useSession';
import { useMenuAnchor } from '@/features/playlists/features/editor/shared/menu-anchor/hooks/useMenuAnchor';
import { useDeleteFlow } from '@/features/playlists/features/editor/features/detail/hooks/useDeleteFlow';
import type {
	DetailNavigation,
	OwnerActions,
	PlaylistDetailScreen,
} from '@/features/playlists/features/editor/features/detail/types/detailScreenTypes';

export function useOwnerActions(
	navigation: DetailNavigation,
	screen: PlaylistDetailScreen
): OwnerActions {
	const { id } = screen;
	const userId = useSession(session => session.user?.id);
	const [sheetVisible, setSheetVisible] = useState(false);

	return {
		isOwner: Boolean(userId) && screen.playlist?.ownerId === userId,
		sheetVisible,
		sheetAnchor: useMenuAnchor(sheetVisible),
		openSheet: useCallback(() => setSheetVisible(true), []),
		closeSheet: () => setSheetVisible(false),
		edit: () => navigation.navigate('CreatePlaylist', { playlistId: id }),
		sharing: () => navigation.navigate('PlaylistSharing', { playlistId: id }),
		remove: useDeleteFlow(screen),
	};
}
