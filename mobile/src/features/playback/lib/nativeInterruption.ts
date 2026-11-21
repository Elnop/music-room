import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import type {
	AudioPlayer,
	AudioPlayerStatus,
} from '@/features/playback/shared/player/types/playerTypes';

export function isSettled(status: AudioPlayerStatus | undefined): boolean {
	if (!status?.isLoaded || status.isBuffering || status.didJustFinish) return false;
	return status.playbackState !== 'idle' && status.playbackState !== 'failed';
}

export function followNativePlaying(player: AudioPlayer, nativePlaying: boolean): void {
	const { playbackState, pausedBySystem, pauseBySystem, resume } = playerStore.getState();
	if (!nativePlaying && playbackState === 'playing') {
		pauseBySystem();
	} else if (nativePlaying && playbackState === 'paused') {
		if (pausedBySystem) {
			resume();
		} else {
			player.pause();
		}
	}
}
