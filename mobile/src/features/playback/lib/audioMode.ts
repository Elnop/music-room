import { setAudioModeAsync } from 'expo-audio';
import { logger } from '@/shared/logging/logger';

/** `doNotMix` lets iOS resume after a call; Android ducks others. */
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
