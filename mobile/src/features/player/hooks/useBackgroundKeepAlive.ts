import { useEffect } from 'react';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { jsKeepAlive } from '@/features/player/services/jsKeepAlive';

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
