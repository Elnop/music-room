import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { showError } from '@/shared/utils/toast';

/**
 * Shows a toast when a track is unavailable (404).
 */
export function PlayerErrorToast(): null {
	const error = usePlayerStore(state => state.error);
	const currentTrack = usePlayerStore(state => state.currentTrack);
	const clearError = usePlayerStore(state => state.clearError);

	const hasShownRef = useRef(false);
	const shouldShow = !!error && !currentTrack;

	useEffect(() => {
		if (shouldShow && !hasShownRef.current) {
			hasShownRef.current = true;
			showError(error || "Cette musique n'est plus disponible");
			clearError();
		} else if (!shouldShow) {
			hasShownRef.current = false;
		}
	}, [shouldShow, error, clearError]);

	return null;
}
