import { useState, useEffect } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';

/**
 * Hook that tracks the player's current time and duration in real-time
 * Updates every 100ms for smooth progress bar updates
 */
export function usePlayerProgress() {
  const { player } = usePlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!player) return;

    const interval = setInterval(() => {
      setCurrentTime(player.currentTime);
      setDuration(player.duration);
    }, 100);

    return () => clearInterval(interval);
  }, [player, player?.isLoaded, player?.playing]);

  return {
    currentTime,
    duration,
    progress: duration > 0 ? (currentTime / duration) * 100 : 0,
  };
}
