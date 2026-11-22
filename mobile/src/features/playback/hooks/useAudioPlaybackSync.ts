import { useEffect } from 'react';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { useStreamStart } from '@/features/playback/hooks/useStreamStart';
import { syncPlayback } from '@/features/playback/lib/syncPlayback';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';

export function useAudioPlaybackSync(player: AudioPlayer): void {
	const playbackState = usePlayerState(state => state.playbackState);
	useStreamStart(player, playbackState);

	useEffect(() => {
		syncPlayback(player, playbackState);
	}, [player, playbackState]);
}
