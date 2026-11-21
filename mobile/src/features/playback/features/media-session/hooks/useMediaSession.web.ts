import { useEffect, useRef } from 'react';
import { usePlayer } from '@/features/playback/shared/player/hooks/usePlayer';
import { useNowPlaying } from '@/features/playback/shared/player/hooks/useNowPlaying';
import { useBrowserMediaHandlers } from '@/features/playback/features/media-session/hooks/useBrowserMediaHandlers';
import { useBrowserMediaMetadata } from '@/features/playback/features/media-session/hooks/useBrowserMediaMetadata';
import { useBrowserPlaybackState } from '@/features/playback/features/media-session/hooks/useBrowserPlaybackState';
import { browserMediaSession } from '@/features/playback/features/media-session/lib/browserMediaSession';

export function useMediaSession(): void {
	const nowPlaying = useNowPlaying();
	const { seekTo } = usePlayer();
	const session = browserMediaSession();
	const latest = useRef({ nowPlaying, seekTo });
	useEffect(() => {
		latest.current = { nowPlaying, seekTo };
	});
	useBrowserMediaHandlers(nowPlaying, latest);
	useBrowserMediaMetadata(nowPlaying.track);
	useBrowserPlaybackState(nowPlaying);
	useEffect(
		() => () => {
			if (!session) return;
			session.metadata = null;
			session.playbackState = 'none';
		},
		[session]
	);
}
