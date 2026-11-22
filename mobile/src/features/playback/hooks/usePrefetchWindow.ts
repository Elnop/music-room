import { useAudioPlayerStatus } from '@/features/playback/lib/audioPlayer';
import {
	PREFETCH_AFTER_PLAYED_S,
	PREFETCH_WINDOW_S,
} from '@/features/playback/shared/player/configs/playerConfig';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';

export function usePrefetchWindow(player: AudioPlayer): boolean {
	const status = useAudioPlayerStatus(player);
	const ownStatus = status !== undefined && status.id === player?.id;
	const duration = ownStatus ? (status.duration ?? 0) : 0;
	const currentTime = ownStatus ? (status.currentTime ?? 0) : 0;
	return (
		duration > 0 &&
		(currentTime >= PREFETCH_AFTER_PLAYED_S || duration - currentTime <= PREFETCH_WINDOW_S)
	);
}
