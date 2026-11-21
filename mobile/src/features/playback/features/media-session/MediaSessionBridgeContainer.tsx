import { useMediaSession } from '@/features/playback/features/media-session/useMediaSession';

export function MediaSessionBridgeContainer(): null {
	useMediaSession();
	return null;
}
