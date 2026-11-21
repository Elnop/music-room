import { useEffect, useRef } from 'react';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { loadStream } from '@/features/playback/shared/player/lib/loadStream';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';

export function useStreamLoader(): void {
	const currentTrack = usePlayerState(state => state.currentTrack);
	const loadCounter = usePlayerState(state => state.loadCounter);
	const loadCounterRef = useRef(loadCounter);

	useEffect(() => {
		loadCounterRef.current = loadCounter;
	}, [loadCounter]);

	useEffect(() => {
		if (!currentTrack) {
			playerStore.getState().setStreamUrl(null);
			return;
		}
		if (playerStore.getState().needsStreamLoad) return;
		void loadStream(currentTrack, () => loadCounterRef.current === loadCounter);
	}, [loadCounter, currentTrack]);
}
