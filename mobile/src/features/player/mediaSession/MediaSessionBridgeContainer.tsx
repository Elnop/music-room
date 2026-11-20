import { useMediaSession } from '@/features/player/mediaSession/hooks/useMediaSession';

/** System media controls: Android notification, lock screen, iOS Control Center. */
export function MediaSessionBridgeContainer(): null {
	useMediaSession();
	return null;
}
