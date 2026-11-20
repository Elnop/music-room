import { useEffect } from 'react';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { jsKeepAlive } from '@/features/playback/lib/jsKeepAlive';

/** Keeps JS timers alive while this device plays or loads a track, so the queue advances in the background. */
export function useBackgroundKeepAlive(): void {
	const active = usePlayerStore(
		state => state.playbackState === 'playing' || state.playbackState === 'loading'
	);

	useEffect(() => {
		if (!active) return;
		jsKeepAlive.start();
		return () => jsKeepAlive.stop();
	}, [active]);
}
