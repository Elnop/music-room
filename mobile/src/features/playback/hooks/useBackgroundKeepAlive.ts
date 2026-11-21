import { useEffect } from 'react';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { jsKeepAlive } from '@/features/playback/lib/jsKeepAlive';

export function useBackgroundKeepAlive(): void {
	const active = usePlayerState(
		state => state.playbackState === 'playing' || state.playbackState === 'loading'
	);

	useEffect(() => {
		if (!active) return;
		jsKeepAlive.start();
		return () => jsKeepAlive.stop();
	}, [active]);
}
