import React, { createContext, useCallback, useContext, useEffect, useRef } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { usePlayerStore, setPositionReader } from '@/store/playerStore';
import { useActiveQueue, useQueueStore } from '@/store/queueStore';
import { nextItem } from '@/store/queueSelectors';
import { isStreamStale, streamPrefetch } from '@/store/streamPrefetch';
import { trackToSoundCloud } from '@utils/trackToSoundCloud';
import { useConnectStore } from '@/store/connectStore';
import { ApiError, apiRequest } from '@/services/api';
import { apiErrorMessage } from '@/utils/apiErrorMessage';
import type { StreamUrlResponse } from '@/types/soundcloud.types';
import { MediaSessionBridge } from '@/components/player/MediaSessionBridge';
import { useLastTrackPersistence } from '@/hooks/useLastTrackPersistence';

// Play in silent mode and in the background. iOS uses `doNotMix` so that it
// resumes the player after a call (`shouldResume`, #310); Android ducks others.
setAudioModeAsync({
	playsInSilentMode: true,
	shouldPlayInBackground: true,
	interruptionMode: 'doNotMix',
	interruptionModeAndroid: 'duckOthers',
}).catch(err => {
	console.warn('[PlayerContext] Failed to set audio mode:', err);
});

// Timeouts - be aggressive!
const FETCH_TIMEOUT_MS = 8000; // 8 seconds max for API call
const PLAYER_LOAD_TIMEOUT_MS = 10000; // 10 seconds max for player to load

// A renewed stream that played this long past its start position is healthy again (#313)
const RENEWAL_HEALTHY_MS = 30 * 1000;

// The next queue item's stream URL is fetched this many seconds before the track end (#314)
const PREFETCH_WINDOW_S = 20;

/**
 * Fetch the stream URL of the track at `permalink`, with its expiry (epoch ms,
 * null when unknown). Throws when the server sends no URL.
 */
async function fetchStreamUrl(
	permalink: string,
	signal: AbortSignal
): Promise<{ streamUrl: string; expiresAt: number | null }> {
	// Use query param instead of path param to avoid Cloudflare WAF blocking URLs in paths
	const streamEndpoint = `/api/soundcloud/stream?url=${encodeURIComponent(permalink)}`;
	const data = await apiRequest<Partial<StreamUrlResponse>>(streamEndpoint, { signal });
	if (!data.streamUrl) throw new Error('Stream not available');
	const expiresAt = data.expiresAt ? Date.parse(data.expiresAt) : NaN;
	return { streamUrl: data.streamUrl, expiresAt: Number.isFinite(expiresAt) ? expiresAt : null };
}

/** This device plays its own audio (renewal is local only: in remote mode another device plays). */
function playsLocally(): boolean {
	return useConnectStore.getState().target.kind === 'local';
}

// MiniPlayer height for padding calculations (content + progress bar + margins)
export const MINI_PLAYER_HEIGHT = 75;

interface PlayerContextValue {
	player: ReturnType<typeof useAudioPlayer>;
	loading: boolean;
	error: string | null;
	/** Seek the current track; renews an expiring stream URL by reloading at `seconds` (#313). */
	seekTo: (seconds: number) => void;
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
		useQueueStore.getState().next();
	}, [didJustFinish, isPlaying, loadCounter]);

	return null;
}

/**
 * Fetches the stream URL of the queue's next item in the last PREFETCH_WINDOW_S
 * seconds of a track played here (#314), so that it starts with no request when
 * it loads (`streamPrefetch.take` in the load effect). Once per (item, track)
 * pair; the held URL is dropped when the next item changes, and a response for
 * an item no longer next is ignored. A failure is silent: the load fetches it
 * again and reports the error. Not in remote mode: the remote device plays.
 */
function NextTrackPrefetcher({ player }: { player: ReturnType<typeof useAudioPlayer> }) {
	const status = useAudioPlayerStatus(player);
	const isPlaying = usePlayerStore(state => state.playbackState === 'playing');
	const isLocal = useConnectStore(state => state.target.kind === 'local');
	const queue = useActiveQueue();
	const queueCurrentId = queue.currentItemId;
	const next = nextItem(queue);
	const nextId = next?.id ?? null;
	const nextPermalink = next ? trackToSoundCloud(next).permalink_url : null;
	const nextKey = nextId !== null && nextPermalink !== null ? `${nextId} ${nextPermalink}` : null;
	// Read by a prefetch response, to ignore one for an item no longer next.
	const nextKeyRef = useRef(nextKey);
	useEffect(() => {
		nextKeyRef.current = nextKey;
	}, [nextKey]);
	const requestedKeyRef = useRef<string | null>(null);
	const playingItemId = usePlayerStore(state => state.queueItemId);

	// Once per played item: playing it again later prefetches its next item again.
	useEffect(() => {
		requestedKeyRef.current = null;
	}, [playingItemId]);

	// The hook can still hold the previous player's last status: only this player's counts.
	const ownStatus = status !== undefined && status.id === player?.id;
	const duration = ownStatus ? (status.duration ?? 0) : 0;
	const currentTime = ownStatus ? (status.currentTime ?? 0) : 0;
	const inWindow = duration > 0 && duration - currentTime <= PREFETCH_WINDOW_S;

	useEffect(() => {
		const held = streamPrefetch.peek();
		if (!held) return;
		// Kept while it is next, or current: the queue stepped to it and the player loads it.
		const stillWanted =
			nextKey === `${held.queueItemId} ${held.permalink}` || held.queueItemId === queueCurrentId;
		if (!isLocal || !stillWanted) streamPrefetch.clear();
	}, [isLocal, nextKey, queueCurrentId]);

	// A queue item still playing while the queue already moved on: not the track before `next`.
	const stepping = playingItemId !== null && playingItemId !== queueCurrentId;

	useEffect(() => {
		if (!isLocal || !isPlaying || !inWindow || stepping) return;
		if (nextKey === null || nextId === null || nextPermalink === null) return;
		if (requestedKeyRef.current === nextKey) return;
		requestedKeyRef.current = nextKey;

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
		fetchStreamUrl(nextPermalink, controller.signal)
			.then(({ streamUrl, expiresAt }) => {
				if (nextKeyRef.current !== nextKey || !playsLocally()) return;
				streamPrefetch.set({ queueItemId: nextId, permalink: nextPermalink, streamUrl, expiresAt });
			})
			.catch(() => undefined)
			.finally(() => clearTimeout(timeoutId));
	}, [isLocal, isPlaying, inWindow, stepping, nextKey, nextId, nextPermalink]);

	return null;
}

/**
 * Renews the stream once when the player fails mid-track (#313): expo-audio sends
 * no error event, so a failure shows as a loaded player going to `idle` (Android)
 * or `failed` (iOS) while the store plays. A second failure in the same load is
 * final, unless the renewed stream has since played RENEWAL_HEALTHY_MS: a long
 * track then survives every URL expiry. Status updates are compared by player id, since a new player is created
 * per stream URL and the hook can still hold the previous player's last status.
 */
function StreamWatchdog({ player }: { player: ReturnType<typeof useAudioPlayer> }) {
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

	return null;
}

/**
 * Mirrors into the store the pauses and resumes the system makes on the player
 * behind the app's back (#310): a call (Android focus loss, iOS interruption) or
 * an unplugged headset (Android `AUDIO_BECOMING_NOISY` via the expo-audio patch,
 * iOS route change). A native pause of a playing track marks the store
 * `pausedBySystem`; a native resume then resumes the store, unless the user
 * paused in between, in which case the player is paused again. Ignores loading,
 * buffering, the track end, a failed player (StreamWatchdog's) and remote mode.
 */
function AudioInterruptionSync({ player }: { player: ReturnType<typeof useAudioPlayer> }) {
	const status = useAudioPlayerStatus(player);
	const lastRef = useRef<{ id: number; playing: boolean } | null>(null);

	const statusId = status?.id;
	const nativePlaying = status?.playing === true;
	const isLoaded = status?.isLoaded ?? false;
	const isBuffering = status?.isBuffering ?? false;
	const didJustFinish = status?.didJustFinish ?? false;
	const playerState = status?.playbackState;

	useEffect(() => {
		if (statusId === undefined || statusId !== player?.id) return;
		const last = lastRef.current;
		const wasPlaying = last !== null && last.id === statusId && last.playing;
		lastRef.current = { id: statusId, playing: nativePlaying };
		if (wasPlaying === nativePlaying || !playsLocally()) return;
		if (!isLoaded || isBuffering || didJustFinish) return;
		if (playerState === 'idle' || playerState === 'failed') return;
		// A late event no longer matches the player (fast pause/play): ignore it.
		if (player.playing !== nativePlaying) return;

		const { playbackState, pausedBySystem, pauseBySystem, resume } = usePlayerStore.getState();
		if (!nativePlaying && playbackState === 'playing') {
			pauseBySystem();
		} else if (nativePlaying && playbackState === 'paused') {
			if (pausedBySystem) {
				resume();
			} else {
				// The user paused during the interruption: it stays paused.
				player.pause();
			}
		}
	}, [statusId, player, nativePlaying, isLoaded, isBuffering, didJustFinish, playerState]);

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
		setPlaybackReady,
	} = usePlayerStore();

	const player = useAudioPlayer(streamUrl || '');
	useLastTrackPersistence();
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
				player.pause();
			}

			previousTrackIdRef.current = currentId;
		}
	}, [currentTrack?.id, player]);

	// Load stream with timeout
	useEffect(() => {
		if (!currentTrack) {
			setStreamUrl(null);
			return;
		}

		// A restored track loads its stream on play, not at start-up (#312).
		if (usePlayerStore.getState().needsStreamLoad) return;

		const thisLoadCounter = loadCounter;

		async function loadStream() {
			if (!currentTrack) return;

			// The next queue item's URL fetched before the previous track ended (#314).
			const prefetched = streamPrefetch.take(
				usePlayerStore.getState().queueItemId,
				currentTrack.permalink_url
			);
			if (prefetched) {
				setStreamUrl(prefetched.streamUrl, prefetched.expiresAt);
				return;
			}

			// Create abort controller for timeout
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

			try {
				const { streamUrl: url, expiresAt } = await fetchStreamUrl(
					currentTrack.permalink_url,
					controller.signal
				);
				clearTimeout(timeoutId);

				// Check if this request is still relevant
				if (currentLoadCounterRef.current !== thisLoadCounter) {
					return;
				}

				setStreamUrl(url, expiresAt);
			} catch (err) {
				clearTimeout(timeoutId);

				// Check if still relevant
				if (currentLoadCounterRef.current !== thisLoadCounter) return;

				// apiRequest wraps the abort in an ApiError, so read the signal itself
				if (controller.signal.aborted) {
					console.error('🔴 [PlayerProvider] Fetch timeout!');
					setTrackUnavailableError('Chargement trop long, réessayez');
				} else if (err instanceof ApiError && err.status === 404) {
					// Track not available
					setTrackUnavailableError("Ce titre n'est plus disponible");
				} else if (err instanceof ApiError && err.status !== undefined) {
					console.error('🔴 [PlayerProvider] Server error details:', err.message);
					setTrackUnavailableError(apiErrorMessage(err, 'Impossible de charger ce titre'));
				} else {
					console.error('🔴 [PlayerProvider] Error:', err instanceof Error ? err.message : err);
					setTrackUnavailableError(apiErrorMessage(err, 'Erreur de chargement du titre'));
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

		// Function to check and play
		const checkAndPlay = () => {
			// Check if still relevant
			if (currentLoadCounterRef.current !== thisLoadCounter || hasTriedToPlayRef.current) {
				return false;
			}

			if (player.isLoaded && player.duration > 0) {
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
				// A stream renewed while paused reloads paused (#313).
				if (usePlayerStore.getState().resumeAfterLoad) {
					player.play();
					setPlaybackPlaying();
				} else {
					setPlaybackReady();
				}

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
				// Cleanup
				if (pollingIntervalRef.current) {
					clearInterval(pollingIntervalRef.current);
					pollingIntervalRef.current = null;
				}

				// Show error
				setTrackUnavailableError('Impossible de charger ce titre');
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
	}, [
		streamUrl,
		player,
		playbackState,
		setPlaybackPlaying,
		setPlaybackReady,
		setTrackUnavailableError,
	]);

	// Sync pause/resume
	useEffect(() => {
		if (!player || !player.isLoaded) return;

		if (playbackState === 'playing' && !player.playing) {
			const { streamExpiresAt, renewStream } = usePlayerStore.getState();
			// Resuming on an expiring URL: reload at the paused position instead (#313).
			if (isStreamStale(streamExpiresAt) && playsLocally()) {
				renewStream(player.currentTime * 1000, true);
				return;
			}
			player.play();
		} else if (playbackState === 'paused' && player.playing) {
			player.pause();
		}
	}, [player, playbackState]);

	// The listening status is emitted outside this provider: expose the position (#295)
	useEffect(() => {
		// While a renewal reloads, the player is the empty one: report where it resumes (#313).
		setPositionReader(() => {
			const { playbackState: state, startPositionMs, needsStreamLoad } = usePlayerStore.getState();
			// A restored track has no player yet: report its saved position (#312).
			if (needsStreamLoad) return startPositionMs ?? 0;
			if (state === 'loading' && startPositionMs !== null) return startPositionMs;
			return player.currentTime * 1000;
		});
		return () => setPositionReader(null);
	}, [player]);

	const seekTo = useCallback(
		(seconds: number) => {
			if (!player) return;
			const {
				playbackState: state,
				streamExpiresAt,
				renewStream,
				markSeek,
				needsStreamLoad,
				setRestoredPosition,
			} = usePlayerStore.getState();
			// A restored track is not loaded yet: play will start it there (#312).
			if (needsStreamLoad) {
				setRestoredPosition(seconds * 1000);
				markSeek();
				return;
			}
			const canRenew = state === 'playing' || state === 'paused';
			if (canRenew && isStreamStale(streamExpiresAt) && playsLocally()) {
				// The reload seeks to the position and re-sends the listening status then;
				// a reload from 0 does not seek, so re-send it now.
				renewStream(seconds * 1000, state === 'playing');
				if (seconds <= 0) markSeek();
				return;
			}
			player.seekTo(seconds);
			markSeek();
		},
		[player]
	);

	const value: PlayerContextValue = {
		player,
		seekTo,
		loading: usePlayerStore(state => state.loading),
		error: usePlayerStore(state => state.error),
	};

	return (
		<PlayerContext.Provider value={value}>
			<QueueAutoAdvance player={player} />
			<StreamWatchdog player={player} />
			<NextTrackPrefetcher player={player} />
			<AudioInterruptionSync player={player} />
			<MediaSessionBridge />
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
