import { useCallback } from 'react';
import { useAddTrack } from '@/features/playlists/features/editor/shared/track-edits/useTrackEdits';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import { sendAdd } from '@/features/playlists/features/editor/features/search-tracks/lib/sendAdd';
import { useAddedUris } from '@/features/playlists/features/editor/features/search-tracks/hooks/useAddedUris';
import { usePlaylistUris } from '@/features/playlists/features/editor/features/search-tracks/hooks/usePlaylistUris';
import type { PlaylistAdds } from '@/features/playlists/features/editor/features/search-tracks/searchTracksTypes';

export function usePlaylistAdds(playlistId: string): PlaylistAdds {
	const playlistUris = usePlaylistUris(playlistId);
	const { uris, tracker } = useAddedUris();
	const { mutateAsync } = useAddTrack();

	return {
		isAdded: (track) => uris.has(track.permalink_url) || playlistUris.has(track.permalink_url),
		add: useCallback(
			(track: SoundCloudTrack) => void sendAdd({ playlistId, tracker, mutate: mutateAsync }, track),
			[playlistId, tracker, mutateAsync],
		),
	};
}
