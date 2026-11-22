import { useEffect, useRef } from 'react';
import { noteHealthyPosition, recoverFailedStream } from '@/features/playback/lib/streamHealth';
import type { AudioPlayer } from '@/features/playback/shared/player/types/playerTypes';
import type { StreamWatch, WatchedStatus } from '@/features/playback/types/playbackEngineTypes';

export function useStreamHealth(
	player: AudioPlayer,
	isPlaying: boolean,
	{ id, playbackState, isLoaded, currentTime }: WatchedStatus,
): void {
	const watchRef = useRef<StreamWatch>({ loadedId: null, handledId: null, lastPositionMs: 0 });

	useEffect(() => {
		if (id === undefined || id !== player?.id) return;
		if (playbackState !== 'idle' && playbackState !== 'failed') {
			if (!isLoaded) return;
			noteHealthyPosition(watchRef.current, {
				statusId: id,
				positionMs: currentTime * 1000,
				isPlaying,
			});
			return;
		}
		recoverFailedStream(watchRef.current, id, isPlaying);
	}, [id, player, playbackState, isLoaded, currentTime, isPlaying]);
}
