import { useEffect } from 'react';
import { largeArtwork } from '@/features/playback/shared/artwork/largeArtwork';
import {
	browserMediaSession,
	browserMetadata,
} from '@/features/playback/features/media-session/lib/browserMediaSession';
import type { NowPlayingTrack } from '@/features/playback/shared/player/types/playerTypes';

export function useBrowserMediaMetadata(track: NowPlayingTrack | null): void {
	const session = browserMediaSession();
	const title = track?.title;
	const artist = track?.artist ?? '';
	const artworkUrl = largeArtwork(track?.artworkUrl);

	useEffect(() => {
		if (!session) return;
		session.metadata = browserMetadata(title, {
			artist,
			artwork: artworkUrl ? [{ src: artworkUrl }] : [],
		});
	}, [session, title, artist, artworkUrl]);
}
