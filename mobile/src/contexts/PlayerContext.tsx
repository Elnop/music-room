import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { usePlayerStore } from '@/store/playerStore';

// Configure audio mode for iOS - play in silent mode and background
setAudioModeAsync({
  playsInSilentMode: true,
  shouldPlayInBackground: true,
  interruptionMode: 'duckOthers',
  interruptionModeAndroid: 'duckOthers',
}).catch(err => {
  console.warn('[PlayerContext] Failed to set audio mode:', err);
});

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

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
        const streamEndpoint = `${API_URL}/api/soundcloud/stream?url=${encodedUrl}`;

        if (__DEV__)
          console.log('🌐 [PlayerProvider] Fetching stream URL:', {
            endpoint: streamEndpoint.substring(0, 100) + '...',
            trackUrl: currentTrack.permalink_url,
          });

        const response = await fetch(streamEndpoint, { signal: controller.signal });
        clearTimeout(timeoutId);

        // Check if this request is still relevant
        if (currentLoadCounterRef.current !== thisLoadCounter) {
          if (__DEV__) console.log('🎵 [PlayerProvider] Stale response, ignoring');
          return;
        }

        if (__DEV__)
          console.log('🌐 [PlayerProvider] Stream response:', {
            status: response.status,
            ok: response.ok,
            statusText: response.statusText,
          });

        // Handle 404 - track not available
        if (response.status === 404) {
          setTrackUnavailableError('This track is no longer available (rights are expensive)');
          return;
        }

        if (!response.ok) {
          // Try to get more error details
          let errorDetail = '';
          try {
            const errorData = await response.text();
            errorDetail = errorData.substring(0, 200);
            console.error('🔴 [PlayerProvider] Server error details:', errorDetail);
          } catch {
            // ignore
          }
          throw new Error(
            `Server error (${response.status}): ${errorDetail || response.statusText}`
          );
        }

        const data = await response.json();

        if (data.success && data.data.streamUrl) {
          if (__DEV__) console.log('🟢 [PlayerProvider] Stream URL obtained');
          setStreamUrl(data.data.streamUrl);
        } else {
          throw new Error('Stream not available');
        }
      } catch (err) {
        clearTimeout(timeoutId);

        // Check if still relevant
        if (currentLoadCounterRef.current !== thisLoadCounter) return;

        if (err instanceof Error && err.name === 'AbortError') {
          console.error('🔴 [PlayerProvider] Fetch timeout!');
          setTrackUnavailableError('Loading too long - try again');
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

  const value: PlayerContextValue = {
    player,
    loading: usePlayerStore(state => state.loading),
    error: usePlayerStore(state => state.error),
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used within PlayerProvider');
  }
  return context;
}

/**
 * Hook to get the height of the MiniPlayer for padding calculations.
 * Returns MINI_PLAYER_HEIGHT when a track is playing, 0 otherwise.
 */
export function usePlayerHeight(): number {
  const currentTrack = usePlayerStore(state => state.currentTrack);
  return currentTrack ? MINI_PLAYER_HEIGHT : 0;
}
