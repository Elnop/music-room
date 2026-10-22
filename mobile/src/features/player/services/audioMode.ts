import { setAudioModeAsync } from 'expo-audio';
import { logger } from '@/shared/utils/logger';

/**
 * Configure global audio mode: play in silent mode and in background.
 * iOS uses `doNotMix` so that it resumes after a call (#310); Android ducks others.
 */
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
