import { useSyncExternalStore } from 'react';
import type { HtmlAudioPlayer } from '@/features/playback/lib/HtmlAudioPlayer';
import type {
	AudioPlayer,
	AudioPlayerStatus,
} from '@/features/playback/shared/player/types/playerTypes';

export function useAudioPlayerStatus(player: AudioPlayer): AudioPlayerStatus {
	const browserPlayer = player as HtmlAudioPlayer;
	return useSyncExternalStore(browserPlayer.subscribe, browserPlayer.getStatus);
}
