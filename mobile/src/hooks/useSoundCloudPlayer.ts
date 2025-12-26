import { useEffect, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import type { SoundCloudTrack } from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export function useSoundCloudPlayer(track: SoundCloudTrack | null) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const player = useAudioPlayer(streamUrl || '');

  // Log player state changes
  useEffect(() => {
    if (!player) return;

    if (__DEV__)
      console.log('🎵 [useSoundCloudPlayer] Player state:', {
        isLoaded: player.isLoaded,
        playing: player.playing,
        duration: player.duration,
        currentTime: player.currentTime,
        hasStreamUrl: !!streamUrl,
      });
  }, [player, player?.isLoaded, player?.playing, player?.duration, streamUrl]);

  // Fetch stream URL when track changes
  useEffect(() => {
    if (!track) {
      if (__DEV__) console.log('🎵 [useSoundCloudPlayer] No track, clearing stream');
      setStreamUrl(null);
      setError(null);
      return;
    }

    async function loadStream() {
      if (__DEV__)
        console.log('🎵 [useSoundCloudPlayer] Loading stream for track:', {
          id: track.id,
          title: track.title,
          permalink_url: track.permalink_url,
        });

      setLoading(true);
      setError(null);

      try {
        const encodedUrl = encodeURIComponent(track.permalink_url);
        const streamEndpoint = `${API_URL}/api/soundcloud/stream/${encodedUrl}`;

        if (__DEV__) console.log('🎵 [useSoundCloudPlayer] Fetching stream from:', streamEndpoint);

        const response = await fetch(streamEndpoint);

        if (__DEV__)
          console.log('🎵 [useSoundCloudPlayer] Stream response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: {
              'content-type': response.headers.get('content-type'),
            },
          });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('🔴 [useSoundCloudPlayer] Stream request failed:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText,
          });
          throw new Error(`Failed to load stream: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (__DEV__)
          console.log('🎵 [useSoundCloudPlayer] Stream response data:', {
            success: data.success,
            hasStreamUrl: !!data.data?.streamUrl,
            streamUrl: data.data?.streamUrl?.substring(0, 100) + '...',
          });

        if (data.success && data.data.streamUrl) {
          if (__DEV__) console.log('🟢 [useSoundCloudPlayer] Stream URL obtained successfully');
          setStreamUrl(data.data.streamUrl);
        } else {
          console.error('🔴 [useSoundCloudPlayer] Stream URL not in response:', data);
          throw new Error('Stream URL not available');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load stream';
        console.error('🔴 [useSoundCloudPlayer] Error loading stream:', {
          error: errorMsg,
          stack: err instanceof Error ? err.stack : undefined,
        });
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }

    loadStream();
  }, [track, track?.id]);

  return { player, loading, error, streamUrl };
}
