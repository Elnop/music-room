import type { PlaybackActions } from '@/shared/playback/types/playbackActionsTypes';
import { useDebouncedText } from '@/features/playlists/features/editor/shared/debounced-text/useDebouncedText';
import { useTrackResults } from '@/features/playlists/features/editor/features/search-tracks/hooks/useTrackResults';
import { usePlaylistAdds } from '@/features/playlists/features/editor/features/search-tracks/hooks/usePlaylistAdds';
import { useResultActions } from '@/features/playlists/features/editor/features/search-tracks/hooks/useResultActions';
import type { SearchTracks } from '@/features/playlists/features/editor/features/search-tracks/searchTracksTypes';

export function useSearchTracks(playlistId: string, playback: PlaybackActions): SearchTracks {
	const search = useDebouncedText();
	return {
		search,
		...useTrackResults(search),
		...usePlaylistAdds(playlistId),
		...useResultActions(playback),
	};
}
