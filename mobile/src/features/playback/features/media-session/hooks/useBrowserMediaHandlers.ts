import { useEffect } from 'react';
import { browserMediaHandlers } from '@/features/playback/features/media-session/lib/browserMediaHandlers';
import {
	browserMediaSession,
	setMediaHandlers,
} from '@/features/playback/features/media-session/lib/browserMediaSession';
import type { LatestRef } from '@/features/playback/features/media-session/mediaSessionTypes';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

export function useBrowserMediaHandlers(nowPlaying: NowPlaying, latest: LatestRef): void {
	const session = browserMediaSession();
	const hasTrack = nowPlaying.track !== null;
	const { isRemote, hasNext, hasPrevious } = nowPlaying;

	useEffect(() => {
		if (!session) return;
		const capabilities = { isRemote, hasNext, hasPrevious };
		setMediaHandlers(session, hasTrack ? browserMediaHandlers(latest, capabilities) : null);
		return () => setMediaHandlers(session, null);
	}, [session, hasTrack, isRemote, hasNext, hasPrevious, latest]);
}
