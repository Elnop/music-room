import { useEffect } from 'react';
import { logger } from '@/shared/logging/logger';
import { browserMediaSession } from '@/features/playback/features/media-session/lib/browserMediaSession';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

export function useBrowserPlaybackState(nowPlaying: NowPlaying): void {
	const session = browserMediaSession();
	const { isPlaying, durationMs } = nowPlaying;
	const hasTrack = nowPlaying.track !== null;
	const positionSeconds = Math.floor(Math.max(0, nowPlaying.positionMs) / 1000);

	useEffect(() => {
		if (!session) return;
		if (!hasTrack) session.playbackState = 'none';
		else session.playbackState = isPlaying ? 'playing' : 'paused';
	}, [session, hasTrack, isPlaying]);

	useEffect(() => {
		const durationSeconds = durationMs && durationMs > 0 ? durationMs / 1000 : null;
		if (!session?.setPositionState || durationSeconds === null) return;
		const position = Math.min(positionSeconds, durationSeconds);
		try {
			session.setPositionState({ duration: durationSeconds, position, playbackRate: 1 });
		} catch (err) {
			logger.debug('[MediaSession] Position state rejected:', err);
		}
	}, [session, durationMs, positionSeconds]);
}
