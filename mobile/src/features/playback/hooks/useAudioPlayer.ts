import { useAudioPlayer as useExpoAudioPlayer } from 'expo-audio';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';
import type { StreamProtocol } from '@/shared/tracks/types/soundcloudTypes';

export function useAudioPlayer(source: string, _protocol: StreamProtocol): AudioPlayer {
	return useExpoAudioPlayer(source);
}
