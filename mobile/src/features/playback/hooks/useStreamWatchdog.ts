import { useAudioPlayerStatus } from '@/features/playback/shared/player/lib/audioPlayer';
import { useStreamHealth } from '@/features/playback/hooks/useStreamHealth';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';

export function useStreamWatchdog(player: AudioPlayer): void {
	const status = useAudioPlayerStatus(player);
	const isPlaying = usePlayerState(state => state.playbackState === 'playing');
	useStreamHealth(player, isPlaying, {
		id: status?.id,
		playbackState: status?.playbackState,
		isLoaded: status?.isLoaded ?? false,
		currentTime: status?.currentTime ?? 0,
	});
}
