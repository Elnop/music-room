import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { streamPrefetch } from '@/features/player/services/streamPrefetch';
import { fetchStreamUrl } from '@/features/player/services/streamApi';
import { ApiError } from '@/shared/services/api';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { FETCH_TIMEOUT_MS } from '@/features/player/constants';

export function useStreamLoader(): void {
	const currentTrack = usePlayerStore(state => state.currentTrack);
	const loadCounter = usePlayerStore(state => state.loadCounter);
	const setStreamUrl = usePlayerStore(state => state.setStreamUrl);
	const setTrackUnavailableError = usePlayerStore(state => state.setTrackUnavailableError);

	const currentLoadCounterRef = useRef(loadCounter);
	useEffect(() => {
		currentLoadCounterRef.current = loadCounter;
	}, [loadCounter]);

	useEffect(() => {
		if (!currentTrack) {
			setStreamUrl(null);
			return;
		}

		// A restored track loads its stream on play, not at start-up.
		if (usePlayerStore.getState().needsStreamLoad) return;

		const thisLoadCounter = loadCounter;

		async function loadStream() {
			if (!currentTrack) return;

			const prefetched = streamPrefetch.take(
				usePlayerStore.getState().queueItemId,
				currentTrack.permalink_url
			);
			if (prefetched) {
				setStreamUrl(prefetched.streamUrl, prefetched.expiresAt);
				return;
			}

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

			try {
				const { streamUrl: url, expiresAt } = await fetchStreamUrl(
					currentTrack.permalink_url,
					controller.signal
				);
				clearTimeout(timeoutId);
				if (currentLoadCounterRef.current !== thisLoadCounter) return;
				setStreamUrl(url, expiresAt);
			} catch (err) {
				clearTimeout(timeoutId);
				if (currentLoadCounterRef.current !== thisLoadCounter) return;

				if (controller.signal.aborted) {
					logger.error('🔴 [PlayerLoader] Fetch timeout!');
					setTrackUnavailableError('Chargement trop long, réessayez');
				} else if (err instanceof ApiError && err.status === 404) {
					setTrackUnavailableError("Ce titre n'est plus disponible");
				} else if (err instanceof ApiError && err.status !== undefined && err.status >= 400) {
					logger.error('🔴 [PlayerLoader] Server error details:', err.message);
					setTrackUnavailableError(apiErrorMessage(err, 'Impossible de charger ce titre'));
				} else {
					logger.error('🔴 [PlayerLoader] Error:', err instanceof Error ? err.message : err);
					setTrackUnavailableError(apiErrorMessage(err, 'Erreur de chargement du titre'));
				}
			}
		}

		loadStream();
	}, [loadCounter, currentTrack, setStreamUrl, setTrackUnavailableError]);
}
