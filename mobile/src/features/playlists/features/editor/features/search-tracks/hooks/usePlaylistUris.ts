import { useMemo } from 'react';
import { useCachedPlaylist } from '@/features/playlists/shared/playlist/usePlaylistQueries';

export function usePlaylistUris(playlistId: string): Set<string> {
	const playlistTracks = useCachedPlaylist(playlistId)?.tracks;
	return useMemo(
		() => new Set((playlistTracks ?? []).map((track) => track.trackUri)),
		[playlistTracks],
	);
}
