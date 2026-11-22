import { useEffect, useRef } from 'react';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import {
	clearLoadTimers,
	resetOnTrackChange,
	watchStreamLoad,
} from '@/features/playback/lib/streamLoadWatch';
import type {
	AudioPlayer,
	StreamLoadWatch,
} from '@/features/playback/shared/player/types/playerTypes';
import type { PlaybackState } from '@/shared/playback/types/playbackTypes';

export function useStreamStart(player: AudioPlayer, playbackState: PlaybackState): void {
	const trackId = usePlayerState((state) => state.currentTrack?.id ?? null);
	const streamUrl = usePlayerState((state) => state.streamUrl);
	const loadCounter = usePlayerState((state) => state.loadCounter);
	const watchRef = useRef<StreamLoadWatch>({
		trackId: null,
		tried: false,
		loadCounter,
		poll: null,
		timeout: null,
	});

	useEffect(() => {
		watchRef.current.loadCounter = loadCounter;
	}, [loadCounter]);

	useEffect(() => () => clearLoadTimers(watchRef.current), []);

	useEffect(() => {
		resetOnTrackChange(watchRef.current, trackId, player);
	}, [trackId, player]);

	useEffect(() => {
		clearLoadTimers(watchRef.current);
		if (!streamUrl || !player || playbackState !== 'loading') return;
		return watchStreamLoad(watchRef.current, player);
	}, [streamUrl, player, playbackState]);
}
