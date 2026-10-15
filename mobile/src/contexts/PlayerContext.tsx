import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { usePlayerStore, setPositionReader } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';
import { useConnectStore } from '@/store/connectStore';
import { ApiError, apiRequest } from '@/services/api';

// Configure audio mode for iOS - play in silent mode and background
setAudioModeAsync({
	playsInSilentMode: true,
	shouldPlayInBackground: true,
	interruptionMode: 'duckOthers',
	interruptionModeAndroid: 'duckOthers',
}).catch(err => {
	console.warn('[PlayerContext] Failed to set audio mode:', err);
});

// Timeouts - be aggressive!
const FETCH_TIMEOUT_MS = 8000; // 8 seconds max for API call
const PLAYER_LOAD_TIMEOUT_MS = 10000; // 10 seconds max for player to load

// MiniPlayer height for padding calculations (content + progress bar + margins)
export const MINI_PLAYER_HEIGHT = 75;

interface PlayerContextValue {
	player: ReturnType<typeof useAudioPlayer>;
	loading: boolean;
	error: string | null;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

/**
 * Plays the next queue item when a track ends (#274), once per loaded track;
 * at the queue end the store stops playback. Only in local mode: in remote
 * mode the device that plays advances itself (#297). Fires on the rising edge of
 * `didJustFinish` while playing, so a stale flag left from the previous track
 * cannot skip the next one. A component of its own so the frequent status
 * updates re-render only it, not the context consumers.
 */
function QueueAutoAdvance({ player }: { player: ReturnType<typeof useAudioPlayer> }) {
	const { didJustFinish } = useAudioPlayerStatus(player);
	const loadCounter = usePlayerStore(state => state.loadCounter);
	const isPlaying = usePlayerStore(state => state.playbackState === 'playing');
	const wasFinishedRef = useRef(false);
	const finishedLoadRef = useRef<number | null>(null);

	useEffect(() => {
		const risingEdge = didJustFinish && !wasFinishedRef.current;
		wasFinishedRef.current = didJustFinish;
		if (!risingEdge || !isPlaying || finishedLoadRef.current === loadCounter) return;
		if (useConnectStore.getState().target.kind !== 'local') return;
		finishedLoadRef.current = loadCounter;
		if (__DEV__) console.log('🎵 [PlayerProvider] Track finished, playing next queue item');
		useQueueStore.getState().next();
	}, [didJustFinish, isPlaying, loadCounter]);

	return null;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
	const {
		currentTrack,
		streamUrl,
		playbackState,
		loadCounter,
		setStreamUrl,
		setTrackUnavailableError,
		setPlaybackPlaying,
	} = usePlayerStore();

	const player = useAudioPlayer(streamUrl || '');
	const previousTrackIdRef = useRef<number | null>(null);
	const hasTriedToPlayRef = useRef(false);
	const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const currentLoadCounterRef = useRef(loadCounter);

	// Track the current loadCounter to detect stale operations
	useEffect(() => {
		currentLoadCounterRef.current = loadCounter;
	}, [loadCounter]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
			if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
		};
	}, []);

	// CRITICAL: Stop the old player and cleanup when track changes
	useEffect(() => {
		const currentId = currentTrack?.id ?? null;
		const previousId = previousTrackIdRef.current;

		if (currentId !== previousId) {
			if (__DEV__)
				console.log('🎵 [PlayerProvider] Track changed:', { from: previousId, to: currentId });

			// Reset flags
			hasTriedToPlayRef.current = false;

			// Clear all timers from previous track
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
			if (loadTimeoutRef.current) {
				clearTimeout(loadTimeoutRef.current);
				loadTimeoutRef.current = null;
			}

			// STOP THE OLD PLAYER IMMEDIATELY
			if (player?.playing) {
				if (__DEV__) console.log('🔴 [PlayerProvider] STOPPING old player immediately');
				player.pause();
			}

			previousTrackIdRef.current = currentId;
		}
	}, [currentTrack?.id, player]);

	// Load stream with timeout
	useEffect(() => {
		if (!currentTrack) {
			if (__DEV__) console.log('🎵 [PlayerProvider] No track, clearing stream');
			setStreamUrl(null);
			return;
		}

		const thisLoadCounter = loadCounter;

		async function loadStream() {
			if (!currentTrack) return;

			if (__DEV__)
				console.log('🎵 [PlayerProvider] Loading stream for track:', {
					id: currentTrack.id,
					title: currentTrack.title,
					loadCounter: thisLoadCounter,
				});

			// Create abort controller for timeout
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

			try {
				// Use query param instead of path param to avoid Cloudflare WAF blocking URLs in paths
				const encodedUrl = encodeURIComponent(currentTrack.permalink_url);
				const streamEndpoint = `/api/soundcloud/stream?url=${encodedUrl}`;

				if (__DEV__)
					console.log('🌐 [PlayerProvider] Fetching stream URL:', {
						endpoint: streamEndpoint.substring(0, 100) + '...',
						trackUrl: currentTrack.permalink_url,
					});

				const data = await apiRequest<{ streamUrl?: string }>(streamEndpoint, {
					signal: controller.signal,
				});
				clearTimeout(timeoutId);

				// Check if this request is still relevant
				if (currentLoadCounterRef.current !== thisLoadCounter) {
					if (__DEV__) console.log('🎵 [PlayerProvider] Stale response, ignoring');
					return;
				}

				if (data.streamUrl) {
					if (__DEV__) console.log('🟢 [PlayerProvider] Stream URL obtained');
					setStreamUrl(data.streamUrl);
				} else {
					throw new Error('Stream not available');
				}
			} catch (err) {
				clearTimeout(timeoutId);

				// Check if still relevant
				if (currentLoadCounterRef.current !== thisLoadCounter) return;

				// apiRequest wraps the abort in an ApiError, so read the signal itself
				if (controller.signal.aborted) {
					console.error('🔴 [PlayerProvider] Fetch timeout!');
					setTrackUnavailableError('Loading too long - try again');
				} else if (err instanceof ApiError && err.status === 404) {
					// Track not available
					setTrackUnavailableError('This track is no longer available (rights are expensive)');
				} else if (err instanceof ApiError && err.status !== undefined) {
					console.error('🔴 [PlayerProvider] Server error details:', err.message);
					setTrackUnavailableError(`Server error (${err.status}): ${err.message}`);
				} else {
					const errorMsg = err instanceof Error ? err.message : 'Loading error';
					console.error('🔴 [PlayerProvider] Error:', errorMsg);
					setTrackUnavailableError(errorMsg);
				}
			}
		}

		loadStream();
	}, [loadCounter, currentTrack, setStreamUrl, setTrackUnavailableError]);

	// ROBUST AUTO-PLAY with strict timeout
	useEffect(() => {
		// Clear any existing timers
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
		if (loadTimeoutRef.current) {
			clearTimeout(loadTimeoutRef.current);
			loadTimeoutRef.current = null;
		}

		if (!streamUrl || !player || playbackState !== 'loading') {
			return;
		}

		const thisLoadCounter = currentLoadCounterRef.current;
		hasTriedToPlayRef.current = false;

		if (__DEV__) console.log('🎵 [PlayerProvider] Starting auto-play polling...');

		// Function to check and play
		const checkAndPlay = () => {
			// Check if still relevant
			if (currentLoadCounterRef.current !== thisLoadCounter || hasTriedToPlayRef.current) {
				return false;
			}

			if (player.isLoaded && player.duration > 0) {
				if (__DEV__)
					console.log('🟢 [PlayerProvider] Player ready! Starting playback...', {
						isLoaded: player.isLoaded,
						duration: player.duration,
					});

				hasTriedToPlayRef.current = true;
				// A transferred playback resumes where the other device was (#297).
				const { startPositionMs } = usePlayerStore.getState();
				if (startPositionMs !== null) {
					player
						.seekTo(startPositionMs / 1000)
						// Re-send the listening status with the new position (#295).
						.then(() => usePlayerStore.getState().markSeek())
						.catch(err => {
							console.warn('[PlayerContext] Start position seek failed:', err);
						});
				}
				player.play();
				setPlaybackPlaying();

				// Cleanup
				if (pollingIntervalRef.current) {
					clearInterval(pollingIntervalRef.current);
					pollingIntervalRef.current = null;
				}
				if (loadTimeoutRef.current) {
					clearTimeout(loadTimeoutRef.current);
					loadTimeoutRef.current = null;
				}

				return true;
			}
			return false;
		};

		// Check immediately
		if (checkAndPlay()) return;

		// Start polling
		pollingIntervalRef.current = setInterval(checkAndPlay, 50);

		// STRICT TIMEOUT - show error if player doesn't load
		loadTimeoutRef.current = setTimeout(() => {
			if (currentLoadCounterRef.current !== thisLoadCounter) return;

			if (!hasTriedToPlayRef.current) {
				if (__DEV__) console.log('🔴 [PlayerProvider] TIMEOUT - player never loaded!');

				// Cleanup
				if (pollingIntervalRef.current) {
					clearInterval(pollingIntervalRef.current);
					pollingIntervalRef.current = null;
				}

				// Show error
				setTrackUnavailableError('Unable to load this track');
			}
		}, PLAYER_LOAD_TIMEOUT_MS);

		return () => {
			if (pollingIntervalRef.current) {
				clearInterval(pollingIntervalRef.current);
				pollingIntervalRef.current = null;
			}
			if (loadTimeoutRef.current) {
				clearTimeout(loadTimeoutRef.current);
				loadTimeoutRef.current = null;
			}
		};
	}, [streamUrl, player, playbackState, setPlaybackPlaying, setTrackUnavailableError]);

	// Sync pause/resume
	useEffect(() => {
		if (!player || !player.isLoaded) return;

		if (playbackState === 'playing' && !player.playing) {
			if (__DEV__) console.log('🎵 [PlayerProvider] Resuming playback');
			player.play();
		} else if (playbackState === 'paused' && player.playing) {
			if (__DEV__) console.log('🎵 [PlayerProvider] Pausing playback');
			player.pause();
		}
	}, [player, playbackState]);

	// The listening status is emitted outside this provider: expose the position (#295)
	useEffect(() => {
		setPositionReader(() => player.currentTime * 1000);
		return () => setPositionReader(null);
	}, [player]);

	const value: PlayerContextValue = {
		player,
		loading: usePlayerStore(state => state.loading),
		error: usePlayerStore(state => state.error),
	};

	return (
		<PlayerContext.Provider value={value}>
			<QueueAutoAdvance player={player} />
			{children}
		</PlayerContext.Provider>
	);
}

export function usePlayer() {
	const context = useContext(PlayerContext);
	if (!context) {
		throw new Error('usePlayer must be used within PlayerProvider');
	}
	return context;
}

/**
 * Height of the MiniPlayer, for bottom padding: always MINI_PLAYER_HEIGHT,
 * since the mini-player is always shown (#296).
 */
export function usePlayerHeight(): number {
	return MINI_PLAYER_HEIGHT;
}
