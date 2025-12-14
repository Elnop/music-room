import { useEffect } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { usePlayerStore } from '@/store/playerStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Hook that manages the audio player lifecycle and stream loading
 * This hook should be used once at the app level (e.g., in AppNavigator)
 * to create and manage the single shared player instance
 */
export function usePlayerController() {
  const {
    currentTrack,
    streamUrl,
    setPlayer,
    setStreamUrl,
    setLoading,
    setError,
    play,
  } = usePlayerStore();

  // Create the audio player instance - useAudioPlayer must be called at component level
  const player = useAudioPlayer(streamUrl || '');

  // Update the player reference in the store whenever it changes
  useEffect(() => {
    console.log('🎵 [usePlayerController] Updating player instance in store');
    setPlayer(player);
  }, [player, setPlayer]);

  // Log player state changes
  useEffect(() => {
    if (!player) return;

    console.log('🎵 [usePlayerController] Player state:', {
      isLoaded: player.isLoaded,
      playing: player.playing,
      duration: player.duration,
      currentTime: player.currentTime,
      hasStreamUrl: !!streamUrl,
    });
  }, [player?.isLoaded, player?.playing, player?.duration, streamUrl]);

  // Fetch stream URL when track changes
  useEffect(() => {
    if (!currentTrack) {
      console.log('🎵 [usePlayerController] No track, clearing stream');
      setStreamUrl(null);
      setError(null);
      return;
    }

    async function loadStream() {
      console.log('🎵 [usePlayerController] Loading stream for track:', {
        id: currentTrack.id,
        title: currentTrack.title,
        permalink_url: currentTrack.permalink_url,
      });

      setLoading(true);
      setError(null);

      try {
        const encodedUrl = encodeURIComponent(currentTrack.permalink_url);
        const streamEndpoint = `${API_URL}/api/soundcloud/stream/${encodedUrl}`;

        console.log('🎵 [usePlayerController] Fetching stream from:', streamEndpoint);

        const response = await fetch(streamEndpoint);

        console.log('🎵 [usePlayerController] Stream response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          headers: {
            'content-type': response.headers.get('content-type'),
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔴 [usePlayerController] Stream request failed:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          throw new Error(`Failed to load stream: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('🎵 [usePlayerController] Stream response data:', {
          success: data.success,
          hasStreamUrl: !!data.data?.streamUrl,
          streamUrl: data.data?.streamUrl?.substring(0, 100) + '...',
        });

        if (data.success && data.data.streamUrl) {
          console.log('🟢 [usePlayerController] Stream URL obtained successfully');
          setStreamUrl(data.data.streamUrl);
        } else {
          console.error('🔴 [usePlayerController] Stream URL not in response:', data);
          throw new Error('Stream URL not available');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load stream';
        console.error('🔴 [usePlayerController] Error loading stream:', {
          error: errorMsg,
          stack: err instanceof Error ? err.stack : undefined,
        });
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    loadStream();
  }, [currentTrack?.id, setStreamUrl, setLoading, setError]);

  // Auto-play when stream is loaded and player is ready
  useEffect(() => {
    if (!player || !streamUrl) return;

    // Wait for player to be loaded
    if (player.isLoaded && player.duration > 0) {
      console.log('🎵 [usePlayerController] Player loaded, auto-playing');
      play();
    }
  }, [player?.isLoaded, player?.duration, streamUrl, play]);

  return {
    player,
    loading: usePlayerStore((state) => state.loading),
    error: usePlayerStore((state) => state.error),
  };
}
