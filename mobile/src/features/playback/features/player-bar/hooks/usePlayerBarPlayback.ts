import { usePlaybackControls } from '@/features/playback/shared/player/hooks/usePlaybackControls';
import { useSeekPosition } from '@/features/playback/shared/seek-bar/useSeekPosition';
import type { PlayerBarPlayback } from '@/features/playback/features/player-bar/playerBarTypes';

export function usePlayerBarPlayback(): PlayerBarPlayback {
	const { nowPlaying, ...transport } = usePlaybackControls();
	const seek = useSeekPosition(transport.currentTime, transport.handleSeek);
	return { nowPlaying, transport, seek };
}
