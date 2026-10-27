import { useEffect, useRef } from 'react';
import { useAudioPlayerStatus } from '@/features/player/services/audioPlayer';
import type { AudioPlayer } from '@/features/player/types';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { isLocalTarget } from '@/shared/services/connectBridge';
import { getPlayback } from '@/shared/services/playbackBridge';

/** Once per loaded track, local mode only: in remote mode the playing device advances itself. */
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
		getPlayback().next();
	}, [didJustFinish, isPlaying, loadCounter]);
}
