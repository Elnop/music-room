import { useCallback } from 'react';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useScreenTitle } from '@/shared/screen-title/useScreenTitle';
import { usePlaylistDetail } from '@/features/playlists/shared/playlist/usePlaylistQueries';
import { useRefetchOnFocus } from '@/features/playlists/shared/refetch-on-focus/useRefetchOnFocus';
import { useDeletedPlaylist } from '@/features/playlists/features/editor/features/detail/hooks/useDeletedPlaylist';
import { useDetailRefresh } from '@/features/playlists/features/editor/features/detail/hooks/useDetailRefresh';
import { loadFailure } from '@/features/playlists/features/editor/features/detail/lib/loadFailure';
import type {
	DetailNavigation,
	PlaylistDetailScreen,
} from '@/features/playlists/features/editor/features/detail/types/detailScreenTypes';

export function usePlaylistDetailScreen(
	navigation: DetailNavigation,
	id: string,
): PlaylistDetailScreen {
	const room = useDeletedPlaylist(navigation, id);
	const detail = usePlaylistDetail(id, room.active);
	const { refetch } = detail;
	const { active } = room;
	useScreenTitle(detail.data?.name);
	useRefetchOnFocus(
		useCallback(() => {
			if (active) void refetch();
		}, [active, refetch]),
	);

	return {
		id,
		playlist: detail.data,
		failure: loadFailure(detail),
		retry: () => void refetch(),
		...useDetailRefresh(refetch),
		markDeleting: room.markDeleting,
		leaveDeleted: room.leaveDeleted,
		bottomPadding: useBottomPadding(),
	};
}
