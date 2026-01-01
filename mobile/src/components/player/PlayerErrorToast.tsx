import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/store/playerStore';
import { showError } from '@utils/toast';

/**
 * Component that shows a Toast when a track is unavailable (404)
 * Uses Toast notifications instead of native Alert
 */
export function PlayerErrorToast() {
  const error = usePlayerStore(state => state.error);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const clearError = usePlayerStore(state => state.clearError);

  const hasShownRef = useRef(false);

  // Show toast when there's an error AND no current track
  const shouldShow = !!error && !currentTrack;

  useEffect(() => {
    if (shouldShow && !hasShownRef.current) {
      hasShownRef.current = true;

      if (__DEV__) console.log('🔔 [Toast] Showing toast for error:', error);

      showError(error || "Cette musique n'est plus disponible");
      clearError();
    } else if (!shouldShow) {
      // Reset when error is cleared
      hasShownRef.current = false;
    }
  }, [shouldShow, error, clearError]);

  // This component doesn't render anything - it just shows toasts
  return null;
}
