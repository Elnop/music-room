import {
	useAudioPlayer as useExpoAudioPlayer,
	useAudioPlayerStatus as useExpoAudioPlayerStatus,
} from 'expo-audio';
import type { AudioPlayer as ExpoAudioPlayer } from 'expo-audio';
import type { AudioPlayer, AudioPlayerStatus } from '@/features/playback/shared/player/lib/types';
import type { StreamProtocol } from '@/shared/tracks/types/soundcloudTypes';

export function useAudioPlayer(source: string, _protocol: StreamProtocol): AudioPlayer {
	return useExpoAudioPlayer(source);
}

export function useAudioPlayerStatus(player: AudioPlayer): AudioPlayerStatus {
	return useExpoAudioPlayerStatus(player as ExpoAudioPlayer);
}
