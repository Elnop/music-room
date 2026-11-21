import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { forgetPlaylist } from '@/features/playlists/features/editor/shared/playlist-mutations/lib/playlistCacheEdits';
import type { DetailNavigation } from '@/features/playlists/features/editor/features/detail/types/detailScreenTypes';

export function useLeavePlaylist(navigation: DetailNavigation, id: string) {
	const client = useQueryClient();
	const [gone, setGone] = useState(false);
	const leave = useCallback(() => {
		setGone(true);
		navigation.popToTop();
		forgetPlaylist(client, id);
	}, [navigation, client, id]);
	return { gone, leave };
}
