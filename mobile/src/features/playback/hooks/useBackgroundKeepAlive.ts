import { useEffect } from 'react';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { jsKeepAlive } from '@/features/playback/lib/jsKeepAlive';

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
