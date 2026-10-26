import {
	useAudioPlayer as useExpoAudioPlayer,
	useAudioPlayerStatus as useExpoAudioPlayerStatus,
	type AudioPlayer as ExpoAudioPlayer,
} from 'expo-audio';
import type { AudioPlayer, AudioPlayerStatus } from '@/features/player/types';

// The browser variant (audioPlayer.web.ts) plays HLS through an audio element, which expo-audio cannot outside Safari.

export function useAudioPlayer(source: string): AudioPlayer {
	return useExpoAudioPlayer(source);
}

/** The player always comes from useAudioPlayer above, so it is an expo-audio player. */
export function useAudioPlayerStatus(player: AudioPlayer): AudioPlayerStatus {
	return useExpoAudioPlayerStatus(player as ExpoAudioPlayer);
}
