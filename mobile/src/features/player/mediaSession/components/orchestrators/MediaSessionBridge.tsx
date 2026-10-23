import { useMediaSession } from '@/features/player/mediaSession/hooks/useMediaSession';

/** System media controls: Android notification, lock screen, iOS Control Center. */
export function MediaSessionBridge(): null {
	useMediaSession();
	return null;
}
