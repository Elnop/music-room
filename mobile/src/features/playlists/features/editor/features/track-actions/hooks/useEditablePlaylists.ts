import { useEffect, useMemo } from 'react';
import { useSession } from '@/shared/backend/hooks/useSession';
import { logger } from '@/shared/logging/logger';
import { usePlaylists } from '@/features/playlists/shared/playlist/usePlaylistQueries';
import { canEditPlaylist } from '@/features/playlists/features/editor/shared/permissions/canEditPlaylist';
import type { EditablePlaylists } from '@/features/playlists/features/editor/features/track-actions/trackActionsTypes';

export function useEditablePlaylists(enabled: boolean): EditablePlaylists {
	const userId = useSession((session) => session.user?.id);
	const list = usePlaylists(enabled);

	useEffect(() => {
		if (list.error) {
			logger.error('[TrackActionsSheetContainer] Loading playlists failed:', list.error);
		}
	}, [list.error]);

	const editable = useMemo(
		() => (list.data ?? []).filter((playlist) => canEditPlaylist(userId, playlist)),
		[list.data, userId],
	);

	return { editable, loadingPlaylists: list.isFetching && editable.length === 0 };
}
