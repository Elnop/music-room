import { useEffect, useRef } from 'react';
import { usePlayerState } from '@/features/playback/shared/player/hooks/usePlayerState';
import { showError } from '@/shared/theme/lib/toast';

export function PlayerErrorToastContainer(): null {
	const error = usePlayerState(state => state.error);
	const currentTrack = usePlayerState(state => state.currentTrack);
	const clearError = usePlayerState(state => state.clearError);

	const hasShownRef = useRef(false);
	const shouldShow = Boolean(error) && !currentTrack;

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
