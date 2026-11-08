import { useMediaSession } from '@/features/player/mediaSession/hooks/useMediaSession';

export function MediaSessionBridge(): null {
	useMediaSession();
	return null;
}
