import { useEffect, useRef } from 'react';
import { useAudioPlayerStatus } from '@/features/playback/shared/player/lib/audioPlayer';
import type { AudioPlayer } from '@/features/playback/shared/player/lib/types';
import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { RENEWAL_HEALTHY_MS } from '@/features/playback/shared/player/lib/constants';
import { isLocalTarget } from '@/features/playback/shared/player/stores/connectStore';

function playsLocally(): boolean {
	return isLocalTarget();
}

export function useStreamWatchdog(player: AudioPlayer): void {
	const status = useAudioPlayerStatus(player);
	const isPlaying = usePlayerStore(state => state.playbackState === 'playing');
	const loadedPlayerIdRef = useRef<number | null>(null);
	const handledPlayerIdRef = useRef<number | null>(null);
	const lastPositionMsRef = useRef(0);

	const statusId = status?.id;
	const playerState = status?.playbackState;
	const isLoaded = status?.isLoaded ?? false;
	const currentTime = status?.currentTime ?? 0;

	useEffect(() => {
		if (statusId === undefined || statusId !== player?.id) return;
		const failed = playerState === 'idle' || playerState === 'failed';
		if (!failed) {
			if (isLoaded) {
				loadedPlayerIdRef.current = statusId;
				lastPositionMsRef.current = currentTime * 1000;
				const { streamRenewed, startPositionMs } = usePlayerStore.getState();
				if (
					isPlaying &&
					streamRenewed &&
					currentTime * 1000 >= (startPositionMs ?? 0) + RENEWAL_HEALTHY_MS
				) {
					usePlayerStore.setState({ streamRenewed: false });
				}
			}
			return;
		}
		if (!isPlaying || loadedPlayerIdRef.current !== statusId) return;
		if (handledPlayerIdRef.current === statusId || !playsLocally()) return;
		handledPlayerIdRef.current = statusId;

		const { streamRenewed, renewStream, setTrackUnavailableError } = usePlayerStore.getState();
		if (streamRenewed) {
			setTrackUnavailableError('Impossible de charger ce titre');
		} else {
			renewStream(lastPositionMsRef.current, true, true);
		}
	}, [statusId, player, playerState, isLoaded, currentTime, isPlaying]);
}
