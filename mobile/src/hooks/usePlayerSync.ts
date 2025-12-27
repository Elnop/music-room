import { useEffect, useRef } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlayerStore, type PlaybackState } from '@/store/playerStore';

/**
 * Hook that synchronizes the audio player with the player store state machine.
 *
 * State transitions handled:
 * - ready -> playing: Auto-starts playback when stream is loaded
 * - playing: Ensures player is playing
 * - paused: Ensures player is paused
 * - loading/idle: Does not interact with player (handled by PlayerContext)
 */
export function usePlayerSync() {
  const { player } = usePlayer();
  const playbackState = usePlayerStore(state => state.playbackState);
  const setPlaybackPlaying = usePlayerStore(state => state.setPlaybackPlaying);
  const lastPlaybackStateRef = useRef<PlaybackState>(playbackState);

  // Sync player with playbackState
  useEffect(() => {
    if (!player) return;

    const previousState = lastPlaybackStateRef.current;
    const currentState = playbackState;

    // Skip if state hasn't changed
    if (previousState === currentState) return;

    if (__DEV__)
      console.log('🎵 [usePlayerSync] State transition:', {
        from: previousState,
        to: currentState,
        playerPlaying: player.playing,
        playerLoaded: player.isLoaded,
      });

    lastPlaybackStateRef.current = currentState;

    switch (currentState) {
      case 'ready':
        // Auto-play when stream is ready
        // This is the key state: we only start playing AFTER the new stream is loaded
        if (__DEV__) console.log('🟢 [usePlayerSync] Stream ready, auto-playing');
        player.play();
        setPlaybackPlaying();
        break;

      case 'playing':
        // Ensure player is playing
        if (!player.playing && player.isLoaded) {
          if (__DEV__) console.log('🎵 [usePlayerSync] Resuming playback');
          player.play();
        }
        break;

      case 'paused':
        // Ensure player is paused
        if (player.playing) {
          if (__DEV__) console.log('🎵 [usePlayerSync] Pausing playback');
          player.pause();
        }
        break;

      case 'loading':
        // Stop any current playback while loading new track
        // This is a safety measure - PlayerContext should already handle this
        if (player.playing) {
          if (__DEV__) console.log('🎵 [usePlayerSync] Loading new track, stopping current');
          player.pause();
        }
        break;

      case 'idle':
        // Nothing to do
        break;
    }
  }, [player, playbackState, setPlaybackPlaying]);
}
