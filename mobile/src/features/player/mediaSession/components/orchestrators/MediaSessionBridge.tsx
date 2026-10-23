import { useMediaSession } from '@/features/player/mediaSession/hooks/useMediaSession';

/**
 * Shows the playing track in the system media controls (Android notification,
 * lock screen, iOS Control Center) and routes actions to the player (#309).
 */
export function MediaSessionBridge(): null {
	useMediaSession();
	return null;
}
