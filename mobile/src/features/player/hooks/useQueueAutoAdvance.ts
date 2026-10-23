import { useEffect, useRef } from 'react';
import { useAudioPlayerStatus, type useAudioPlayer } from 'expo-audio';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { isLocalTarget } from '@/shared/services/connectBridge';
import { getPlayback } from '@/shared/services/playbackBridge';

/**
 * Plays the next queue item when a track ends (#274), once per loaded track;
 * at the queue end the store stops playback. Only in local mode: in remote
 * mode the device that plays advances itself (#297).
 */
export function useQueueAutoAdvance(player: ReturnType<typeof useAudioPlayer>): void {
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
