import React, { createContext, useContext, useEffect } from 'react';
import { useAudioPlayer } from 'expo-audio';
import { usePlayerStore } from '@/store/playerStore';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

interface PlayerContextValue {
  player: ReturnType<typeof useAudioPlayer>;
  loading: boolean;
  error: string | null;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { currentTrack, streamUrl, setStreamUrl, setLoading, setError } = usePlayerStore();

  const player = useAudioPlayer(streamUrl || '');

  useEffect(() => {
    if (!player) return;

    if (__DEV__)
      console.log('🎵 [PlayerProvider] Player state:', {
        isLoaded: player.isLoaded,
        playing: player.playing,
        duration: player.duration,
        currentTime: player.currentTime,
        hasStreamUrl: !!streamUrl,
      });
  }, [player, player?.isLoaded, player?.playing, player?.duration, streamUrl]);

  useEffect(() => {
    if (!currentTrack) {
      if (__DEV__) console.log('🎵 [PlayerProvider] No track, clearing stream');
      setStreamUrl(null);
      setError(null);
      return;
    }

    async function loadStream() {
      if (!currentTrack) return;

      if (__DEV__)
        console.log('🎵 [PlayerProvider] Loading stream for track:', {
          id: currentTrack.id,
          title: currentTrack.title,
          permalink_url: currentTrack.permalink_url,
        });

      setLoading(true);
      setError(null);

      try {
        const encodedUrl = encodeURIComponent(currentTrack.permalink_url);
        const streamEndpoint = `${API_URL}/api/soundcloud/stream/${encodedUrl}`;

        if (__DEV__) console.log('🎵 [PlayerProvider] Fetching stream from:', streamEndpoint);

        const response = await fetch(streamEndpoint);

        if (__DEV__)
          console.log('🎵 [PlayerProvider] Stream response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
          });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔴 [PlayerProvider] Stream request failed:', {
            status: response.status,
            body: errorText,
          });
          throw new Error(`Failed to load stream: ${response.status}`);
        }

        const data = await response.json();
        if (__DEV__)
          console.log('🎵 [PlayerProvider] Stream response data:', {
            success: data.success,
            hasStreamUrl: !!data.data?.streamUrl,
          });

        if (data.success && data.data.streamUrl) {
          if (__DEV__) console.log('🟢 [PlayerProvider] Stream URL obtained successfully');
          setStreamUrl(data.data.streamUrl);
        } else {
          throw new Error('Stream URL not available');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load stream';
        console.error('🔴 [PlayerProvider] Error loading stream:', errorMsg);
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    loadStream();
  }, [currentTrack, currentTrack?.id, setStreamUrl, setLoading, setError]);

  useEffect(() => {
    if (!player || !streamUrl) return;

    if (player.isLoaded && player.duration > 0) {
      if (__DEV__) console.log('🎵 [PlayerProvider] Player loaded, auto-playing');
      player.play();
    }
  }, [player, player?.isLoaded, player?.duration, streamUrl]);

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
