import { useAudioPlayerStatus as useExpoAudioPlayerStatus } from 'expo-audio';
import type { AudioPlayer as ExpoAudioPlayer } from 'expo-audio';
import type {
	AudioPlayer,
	AudioPlayerStatus,
} from '@/features/playback/shared/player/types/playerTypes';

export function useAudioPlayerStatus(player: AudioPlayer): AudioPlayerStatus {
	return useExpoAudioPlayerStatus(player as ExpoAudioPlayer);
}
