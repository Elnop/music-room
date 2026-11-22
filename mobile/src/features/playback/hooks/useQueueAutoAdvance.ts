import { useEffect, useRef } from 'react';
import { useAudioPlayerStatus } from '@/features/playback/lib/audioPlayer';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';
import { isLocalTarget } from '@/features/playback/lib/isLocalTarget';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { queueStore } from '@/features/playback/shared/player/stores/queueStore';

export function useQueueAutoAdvance(player: AudioPlayer): void {
	const { didJustFinish } = useAudioPlayerStatus(player);
	const loadCounter = usePlayerState(state => state.loadCounter);
	const isPlaying = usePlayerState(state => state.playbackState === 'playing');
	const wasFinishedRef = useRef(false);
	const finishedLoadRef = useRef<number | null>(null);

	useEffect(() => {
		const risingEdge = didJustFinish && !wasFinishedRef.current;
		wasFinishedRef.current = didJustFinish;
		if (!risingEdge || !isPlaying || finishedLoadRef.current === loadCounter) return;
		if (!isLocalTarget()) return;
		finishedLoadRef.current = loadCounter;
		queueStore.getState().next();
	}, [didJustFinish, isPlaying, loadCounter]);
}
