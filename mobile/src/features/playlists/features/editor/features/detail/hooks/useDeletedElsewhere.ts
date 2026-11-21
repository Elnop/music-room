import { useEffect } from 'react';
import type { RefObject } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { showInfo } from '@/shared/theme/lib/toast';
import { forgetPlaylist } from '@/features/playlists/features/editor/shared/playlist-mutations/lib/playlistCacheEdits';
import { usePlaylistRoom } from '@/features/playlists/features/editor/features/detail/hooks/usePlaylistRoom';
import type { DetailNavigation } from '@/features/playlists/features/editor/features/detail/types/detailScreenTypes';

export function useDeletedElsewhere(
	navigation: DetailNavigation,
	id: string,
	deletingRef: RefObject<boolean>
): boolean {
	const client = useQueryClient();
	const { deleted } = usePlaylistRoom(id);

	useEffect(() => {
		if (!deleted || deletingRef.current) return;
		showInfo('Cette playlist a été supprimée');
		if (navigation.canGoBack()) navigation.goBack();
		else navigation.navigate('Playlists');
		forgetPlaylist(client, id);
	}, [deleted, navigation, client, id, deletingRef]);

	return deleted;
}
