import { useMediaSession } from '@/features/playback/features/media-session/hooks/useMediaSession';

export function MediaSessionBridgeContainer(): null {
	useMediaSession();
	return null;
}
