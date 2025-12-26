import { useEffect, useRef } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlayerStore } from '@/store/playerStore';

/**
 * Hook that synchronizes the audio player with the player store state
 * This ensures that play/pause actions from the store are applied to the actual player
 */
export function usePlayerSync() {
  const { player } = usePlayer();
  const isPlaying = usePlayerStore(state => state.isPlaying);
  const lastIsPlayingRef = useRef(isPlaying);

  // Sync player playback with isPlaying state
  useEffect(() => {
    if (!player) return;

    // Only sync if isPlaying state actually changed
    if (lastIsPlayingRef.current === isPlaying) return;
    lastIsPlayingRef.current = isPlaying;

    // If store says playing but player is paused, start playback
    if (isPlaying && !player.playing) {
      if (__DEV__) console.log('🎵 [usePlayerSync] Starting playback');
      player.play();
    }

    // If store says paused but player is playing, pause playback
    if (!isPlaying && player.playing) {
      if (__DEV__) console.log('🎵 [usePlayerSync] Pausing playback');
      player.pause();
    }
  }, [player, isPlaying]);
}
