import {
	useAudioPlayer as useExpoAudioPlayer,
	useAudioPlayerStatus as useExpoAudioPlayerStatus,
	type AudioPlayer as ExpoAudioPlayer,
} from 'expo-audio';
import type { AudioPlayer, AudioPlayerStatus } from '@/features/player/types';
import type { StreamProtocol } from '@/types/soundcloud.types';

export function useAudioPlayer(source: string, _protocol: StreamProtocol): AudioPlayer {
	return useExpoAudioPlayer(source);
}

export function useAudioPlayerStatus(player: AudioPlayer): AudioPlayerStatus {
	return useExpoAudioPlayerStatus(player as ExpoAudioPlayer);
}
