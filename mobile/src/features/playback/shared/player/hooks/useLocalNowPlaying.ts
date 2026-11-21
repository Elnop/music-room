import { useMemo } from 'react';
import { useLocalTiming } from '@/features/playback/shared/player/hooks/useLocalTiming';
import { useLocalTransport } from '@/features/playback/shared/player/hooks/useLocalTransport';
import { usePlaybackStatus } from '@/features/playback/shared/player/hooks/usePlaybackStatus';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { toNowPlayingTrack } from '@/features/playback/shared/player/lib/toNowPlayingTrack';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';

export function useLocalNowPlaying(): NowPlaying {
	const currentTrack = usePlayerState(state => state.currentTrack);
	const status = usePlaybackStatus(currentTrack);
	const timing = useLocalTiming(currentTrack);
	const transport = useLocalTransport(timing.positionMs);
	const track = useMemo(() => toNowPlayingTrack(currentTrack), [currentTrack]);

	return { isRemote: false, track, ...status, ...timing, deviceLabel: null, ...transport };
}
