import { useEffect } from 'react';
import { disableMediaControls, enableMediaControls } from 'expo-media-control';
import {
	mediaCapabilities,
	safely,
} from '@/features/playback/features/media-session/lib/mediaControls';
import type { SentRef } from '@/features/playback/features/media-session/mediaSessionTypes';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

export function useMediaControlsEnabled(nowPlaying: NowPlaying, sent: SentRef): void {
	const hasTrack = nowPlaying.track !== null;
	const { isRemote, hasNext, hasPrevious } = nowPlaying;

	useEffect(() => {
		if (!hasTrack) {
			sent.current = null;
			safely(disableMediaControls());
			return;
		}
		const capabilities = mediaCapabilities({ isRemote, hasNext, hasPrevious });
		safely(enableMediaControls({ capabilities }));
	}, [hasTrack, isRemote, hasNext, hasPrevious, sent]);
}
