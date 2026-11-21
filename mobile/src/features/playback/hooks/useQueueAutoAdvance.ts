import { useEffect, useRef } from 'react';
import { useAudioPlayerStatus } from '@/features/playback/shared/player/lib/audioPlayer';
import type { AudioPlayer } from '@/features/playback/shared/player/lib/types';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { useQueueStore } from '@/features/playback/shared/player/stores/queueStore';
import { isLocalTarget } from '@/features/playback/shared/player/stores/connectStore';

export function useQueueAutoAdvance(player: AudioPlayer): void {
	const { didJustFinish } = useAudioPlayerStatus(player);
	const loadCounter = usePlayerStore(state => state.loadCounter);
	const isPlaying = usePlayerStore(state => state.playbackState === 'playing');
	const wasFinishedRef = useRef(false);
	const finishedLoadRef = useRef<number | null>(null);

	useEffect(() => {
		const risingEdge = didJustFinish && !wasFinishedRef.current;
		wasFinishedRef.current = didJustFinish;
		if (!risingEdge || !isPlaying || finishedLoadRef.current === loadCounter) return;
		if (!isLocalTarget()) return;
		finishedLoadRef.current = loadCounter;
		useQueueStore.getState().next();
	}, [didJustFinish, isPlaying, loadCounter]);
}
