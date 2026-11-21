import { useEffect } from 'react';
import { updateMetadata } from 'expo-media-control';
import type { MediaMetadata } from 'expo-media-control';
import { largeArtwork } from '@/features/playback/shared/artwork/largeArtwork';
import {
	mediaDurationSeconds,
	safely,
} from '@/features/playback/features/media-session/lib/mediaControls';
import type { SentRef } from '@/features/playback/features/media-session/mediaSessionTypes';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

export function useMediaMetadata(nowPlaying: NowPlaying, sent: SentRef): void {
	const durationSeconds = mediaDurationSeconds(nowPlaying.durationMs);
	const trackId = nowPlaying.track?.id;
	const title = nowPlaying.track?.title;
	const artist = nowPlaying.track?.artist;
	const artworkUrl = largeArtwork(nowPlaying.track?.artworkUrl);

	useEffect(() => {
		if (trackId === undefined || title === undefined) return;
		const metadata: MediaMetadata = { title, artist };
		if (artworkUrl) metadata.artwork = { uri: artworkUrl };
		if (durationSeconds !== null) metadata.duration = durationSeconds;
		safely(updateMetadata(metadata));
		sent.current = null;
	}, [trackId, title, artist, artworkUrl, durationSeconds, sent]);
}
