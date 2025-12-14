import { useEffect, useState } from 'react';
import { useAudioPlayer } from 'expo-audio';
import type { SoundCloudTrack } from '@/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export function useSoundCloudPlayer(track: SoundCloudTrack | null) {
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const player = useAudioPlayer(streamUrl || '');

  // Fetch stream URL when track changes
  useEffect(() => {
    if (!track) {
      setStreamUrl(null);
      setError(null);
      return;
    }

    async function loadStream() {
      setLoading(true);
      setError(null);

      try {
        const encodedUrl = encodeURIComponent(track.permalink_url);
        const response = await fetch(
          `${API_URL}/api/soundcloud/stream/${encodedUrl}`
        );

        if (!response.ok) {
          throw new Error('Failed to load stream');
        }

        const data = await response.json();

        if (data.success && data.data.streamUrl) {
          setStreamUrl(data.data.streamUrl);
        } else {
          throw new Error('Stream URL not available');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stream');
      } finally {
        setLoading(false);
      }
    }

    loadStream();
  }, [track?.id]);

  return { player, loading, error, streamUrl };
}
