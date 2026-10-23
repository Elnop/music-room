import { useEffect, useRef } from 'react';
import { useAudioPlayerStatus, type useAudioPlayer } from 'expo-audio';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { isLocalTarget } from '@/shared/services/connectBridge';
import { RENEWAL_HEALTHY_MS } from '@/features/player/constants';

function playsLocally(): boolean {
	return isLocalTarget();
}

/**
 * Renews the stream once when the player fails mid-track (#313).
 */
export function useStreamWatchdog(player: ReturnType<typeof useAudioPlayer>): void {
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
