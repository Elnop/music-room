import { readPositionMs } from '@/features/playback/shared/player/lib/positionReader';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';

export function getPlayerState() {
	const { currentTrack, queueItemId, loadCounter } = playerStore.getState();
	return { currentTrack, queueItemId, loadCounter, positionMs: readPositionMs() ?? 0 };
}
