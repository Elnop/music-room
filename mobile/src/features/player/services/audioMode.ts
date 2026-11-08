import { setAudioModeAsync } from 'expo-audio';
import { logger } from '@/shared/utils/logger';

export function configureAudioMode(): void {
	setAudioModeAsync({
		playsInSilentMode: true,
		shouldPlayInBackground: true,
		interruptionMode: 'doNotMix',
		interruptionModeAndroid: 'duckOthers',
	}).catch(err => {
		logger.warn('[PlayerAudioMode] Failed to set audio mode:', err);
	});
}
