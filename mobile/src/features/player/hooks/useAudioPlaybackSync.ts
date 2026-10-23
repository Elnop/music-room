import { useEffect, useRef } from 'react';
import type { useAudioPlayer } from 'expo-audio';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { useConnectStore } from '@/store/connectStore';
import { isStreamStale } from '@/features/player/services/streamPrefetch';
import { logger } from '@/shared/utils/logger';
import { PLAYER_LOAD_TIMEOUT_MS } from '@/features/player/constants';

const playsLocally = () => useConnectStore.getState().target.kind === 'local';

function clearTimers(
	pollRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>,
	timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>
) {
	if (pollRef.current) {
		clearInterval(pollRef.current);
		pollRef.current = null;
	}
	if (timeoutRef.current) {
		clearTimeout(timeoutRef.current);
		timeoutRef.current = null;
	}
}

export function useAudioPlaybackSync(player: ReturnType<typeof useAudioPlayer>): void {
	const currentTrack = usePlayerStore(state => state.currentTrack);
	const streamUrl = usePlayerStore(state => state.streamUrl);
	const playbackState = usePlayerStore(state => state.playbackState);
	const loadCounter = usePlayerStore(state => state.loadCounter);
	const setPlaybackPlaying = usePlayerStore(state => state.setPlaybackPlaying);
	const setPlaybackReady = usePlayerStore(state => state.setPlaybackReady);
	const setTrackUnavailableError = usePlayerStore(state => state.setTrackUnavailableError);

	const previousTrackIdRef = useRef<number | null>(null);
	const hasTriedToPlayRef = useRef(false);
	const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const currentLoadCounterRef = useRef(loadCounter);

	useEffect(() => {
		currentLoadCounterRef.current = loadCounter;
	}, [loadCounter]);

	useEffect(() => () => clearTimers(pollingIntervalRef, loadTimeoutRef), []);

	// Stop old player and clean up on track change
	useEffect(() => {
		const currentId = currentTrack?.id ?? null;
		if (currentId !== previousTrackIdRef.current) {
			hasTriedToPlayRef.current = false;
			clearTimers(pollingIntervalRef, loadTimeoutRef);
			if (player?.playing) player.pause();
			previousTrackIdRef.current = currentId;
		}
	}, [currentTrack?.id, player]);

	// Auto-play when player becomes loaded
	useEffect(() => {
		clearTimers(pollingIntervalRef, loadTimeoutRef);
		if (!streamUrl || !player || playbackState !== 'loading') return;

		const thisLoadCounter = currentLoadCounterRef.current;
		hasTriedToPlayRef.current = false;

		const checkAndPlay = () => {
			if (currentLoadCounterRef.current !== thisLoadCounter || hasTriedToPlayRef.current) {
				return false;
			}
			if (player.isLoaded && player.duration > 0) {
				hasTriedToPlayRef.current = true;
				const { startPositionMs, resumeAfterLoad, markSeek } = usePlayerStore.getState();
				if (startPositionMs !== null) {
					player
						.seekTo(startPositionMs / 1000)
						.then(() => markSeek())
						.catch(err => {
							logger.warn('[PlayerAudioSync] Start position seek failed:', err);
						});
				}
				if (resumeAfterLoad) {
					player.play();
					setPlaybackPlaying();
				} else {
					setPlaybackReady();
				}
				clearTimers(pollingIntervalRef, loadTimeoutRef);
				return true;
			}
			return false;
		};

		if (checkAndPlay()) return;
		pollingIntervalRef.current = setInterval(checkAndPlay, 50);

		loadTimeoutRef.current = setTimeout(() => {
			if (currentLoadCounterRef.current !== thisLoadCounter) return;
			if (!hasTriedToPlayRef.current) {
				clearTimers(pollingIntervalRef, loadTimeoutRef);
				setTrackUnavailableError('Impossible de charger ce titre');
			}
		}, PLAYER_LOAD_TIMEOUT_MS);

		return () => clearTimers(pollingIntervalRef, loadTimeoutRef);
	}, [
		streamUrl,
		player,
		playbackState,
		setPlaybackPlaying,
		setPlaybackReady,
		setTrackUnavailableError,
	]);

	// Sync pause and resume
	useEffect(() => {
		if (!player || !player.isLoaded) return;
		if (playbackState === 'playing' && !player.playing) {
			const { streamExpiresAt, renewStream } = usePlayerStore.getState();
			if (isStreamStale(streamExpiresAt) && playsLocally()) {
				renewStream(player.currentTime * 1000, true);
				return;
			}
			player.play();
		} else if (playbackState === 'paused' && player.playing) {
			player.pause();
		}
	}, [player, playbackState]);
}
