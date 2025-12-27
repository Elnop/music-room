import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { usePlayerStore } from '@/store/playerStore';

/**
 * Component that shows an Alert when a track is unavailable (404)
 * Uses native Alert which always works on all platforms
 */
export function PlayerErrorToast() {
  const error = usePlayerStore(state => state.error);
  const currentTrack = usePlayerStore(state => state.currentTrack);
  const clearError = usePlayerStore(state => state.clearError);

  const hasShownRef = useRef(false);

  // Show alert when there's an error AND no current track
  const shouldShow = !!error && !currentTrack;

  useEffect(() => {
    if (shouldShow && !hasShownRef.current) {
      hasShownRef.current = true;

      if (__DEV__) console.log('🔔 [Toast] Showing alert for error:', error);

      Alert.alert('Musique indisponible', error || "Cette musique n'est plus disponible", [
        {
          text: 'OK',
          onPress: () => {
            clearError();
          },
        },
      ]);
    } else if (!shouldShow) {
      // Reset when error is cleared
      hasShownRef.current = false;
    }
  }, [shouldShow, error, clearError]);

  // This component doesn't render anything - it just shows alerts
  return null;
}
