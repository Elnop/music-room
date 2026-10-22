import { useEffect, useRef } from 'react';
import { useAudioPlayerStatus, type useAudioPlayer } from 'expo-audio';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { useConnectStore } from '@/store/connectStore';

function playsLocally(): boolean {
	return useConnectStore.getState().target.kind === 'local';
}

/**
 * Mirrors into the store the pauses and resumes the system makes on the player
 * behind the app's back (#310): calls or unplugged headsets.
 */
export function useAudioInterruption(player: ReturnType<typeof useAudioPlayer>): void {
	const status = useAudioPlayerStatus(player);
	const lastRef = useRef<{ id: number; playing: boolean } | null>(null);

	const statusId = status?.id;
	const nativePlaying = status?.playing === true;
	const isLoaded = status?.isLoaded ?? false;
	const isBuffering = status?.isBuffering ?? false;
	const didJustFinish = status?.didJustFinish ?? false;
	const playerState = status?.playbackState;

	useEffect(() => {
		if (statusId === undefined || statusId !== player?.id) return;
		const last = lastRef.current;
		const wasPlaying = last !== null && last.id === statusId && last.playing;
		lastRef.current = { id: statusId, playing: nativePlaying };
		if (wasPlaying === nativePlaying || !playsLocally()) return;
		if (!isLoaded || isBuffering || didJustFinish) return;
		if (playerState === 'idle' || playerState === 'failed') return;
		if (player.playing !== nativePlaying) return;

		const { playbackState, pausedBySystem, pauseBySystem, resume } = usePlayerStore.getState();
		if (!nativePlaying && playbackState === 'playing') {
			pauseBySystem();
		} else if (nativePlaying && playbackState === 'paused') {
			if (pausedBySystem) {
				resume();
			} else {
				player.pause();
			}
		}
	}, [statusId, player, nativePlaying, isLoaded, isBuffering, didJustFinish, playerState]);
}
