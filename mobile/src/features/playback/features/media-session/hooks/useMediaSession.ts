import { useEffect, useRef } from 'react';
import { usePlayer } from '@/features/playback/shared/player/hooks/usePlayer';
import { useNowPlaying } from '@/features/playback/shared/player/hooks/useNowPlaying';
import { useMediaControlListener } from '@/features/playback/features/media-session/hooks/useMediaControlListener';
import { useMediaControlsEnabled } from '@/features/playback/features/media-session/hooks/useMediaControlsEnabled';
import { useMediaMetadata } from '@/features/playback/features/media-session/hooks/useMediaMetadata';
import { useMediaPlaybackState } from '@/features/playback/features/media-session/hooks/useMediaPlaybackState';
import type { SentState } from '@/features/playback/features/media-session/mediaSessionTypes';

export function useMediaSession(): void {
	const nowPlaying = useNowPlaying();
	const { seekTo } = usePlayer();
	const latest = useRef({ nowPlaying, seekTo });
	const sent = useRef<SentState | null>(null);
	useEffect(() => {
		latest.current = { nowPlaying, seekTo };
	});
	useMediaControlListener(latest, sent);
	useMediaControlsEnabled(nowPlaying, sent);
	useMediaMetadata(nowPlaying, sent);
	useMediaPlaybackState(nowPlaying, sent);
}
