import { PLAYER_LOAD_TIMEOUT_MS } from '@/features/playback/shared/player/configs/playerConfig';
import { recoverLoadTimeout, startLoadedPlayer } from '@/features/playback/lib/startLoadedPlayer';
import type {
	AudioPlayer,
	StreamLoadWatch,
} from '@/features/playback/shared/player/types/playerTypes';

export function clearLoadTimers(watch: StreamLoadWatch): void {
	if (watch.poll) {
		clearInterval(watch.poll);
		watch.poll = null;
	}
	if (watch.timeout) {
		clearTimeout(watch.timeout);
		watch.timeout = null;
	}
}

export function resetOnTrackChange(
	watch: StreamLoadWatch,
	trackId: number | null,
	player: AudioPlayer,
): void {
	if (trackId === watch.trackId) return;
	watch.tried = false;
	clearLoadTimers(watch);
	if (player?.playing) player.pause();
	watch.trackId = trackId;
}

function tryStart(watch: StreamLoadWatch, player: AudioPlayer, loadCounter: number): boolean {
	if (watch.loadCounter !== loadCounter || watch.tried) return false;
	if (!(player.isLoaded && player.duration > 0)) return false;
	watch.tried = true;
	startLoadedPlayer(player);
	clearLoadTimers(watch);
	return true;
}

export function watchStreamLoad(watch: StreamLoadWatch, player: AudioPlayer): () => void {
	const loadCounter = watch.loadCounter;
	watch.tried = false;
	if (tryStart(watch, player, loadCounter)) return () => clearLoadTimers(watch);
	watch.poll = setInterval(() => tryStart(watch, player, loadCounter), 50);
	watch.timeout = setTimeout(() => {
		if (watch.loadCounter !== loadCounter || watch.tried) return;
		clearLoadTimers(watch);
		recoverLoadTimeout();
	}, PLAYER_LOAD_TIMEOUT_MS);
	return () => clearLoadTimers(watch);
}
