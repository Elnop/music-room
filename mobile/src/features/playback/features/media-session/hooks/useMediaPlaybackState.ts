import { useEffect } from 'react';
import { PlaybackState, updatePlaybackState } from 'expo-media-control';
import {
	safely,
	sentKey,
	systemState,
} from '@/features/playback/features/media-session/lib/mediaControls';
import type { SentRef } from '@/features/playback/features/media-session/mediaSessionTypes';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

const POSITION_JUMP_MS = 2000;

export function useMediaPlaybackState(nowPlaying: NowPlaying, sent: SentRef): void {
	const hasTrack = nowPlaying.track !== null;
	const state = systemState(nowPlaying);
	const { positionMs } = nowPlaying;
	const key = sentKey(nowPlaying);

	useEffect(() => {
		if (!hasTrack) return;
		const now = Date.now();
		const previous = sent.current;
		if (previous && previous.key === key && previous.state === state) {
			const elapsed = state === PlaybackState.PLAYING ? now - previous.at : 0;
			if (Math.abs(positionMs - (previous.positionMs + elapsed)) < POSITION_JUMP_MS) return;
		}
		sent.current = { state, positionMs, at: now, key };
		safely(updatePlaybackState(state, Math.max(0, positionMs) / 1000));
	}, [hasTrack, state, positionMs, key, sent]);
}
