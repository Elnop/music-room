import { useEffect } from 'react';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { jsKeepAlive } from '@/features/player/services/jsKeepAlive';

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
