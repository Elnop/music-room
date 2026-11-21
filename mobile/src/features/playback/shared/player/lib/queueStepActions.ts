import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { queueApi } from '@/features/playback/shared/player/lib/queueApi';
import { playPlaylistError } from '@/features/playback/shared/player/lib/playPlaylistError';
import { asStep, runStep } from '@/features/playback/shared/player/lib/queueStepRunner';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import type {
	QueueGet,
	QueueStepOutcome,
	QueueStoreState,
} from '@/features/playback/shared/player/types/queueTypes';

type QueueStepActions = Pick<QueueStoreState, 'next' | 'previous' | 'playItem' | 'playPlaylist'>;

async function stepNext(get: QueueGet): Promise<QueueStepOutcome> {
	const outcome = await runStep(call => queueApi.next(call), 'Next', get().applyState);
	if (outcome === 'boundary' && connectStore.getState().target.kind === 'local') {
		playerStore.getState().stop();
	}
	return outcome;
}

export function queueStepActions(get: QueueGet): QueueStepActions {
	return {
		next: () => stepNext(get),
		previous: () => runStep(call => queueApi.previous(call), 'Previous', get().applyState),
		playItem: itemId =>
			runStep(
				asStep(call => queueApi.playItem(itemId, call)),
				'Play item',
				get().applyState,
				{
					errorMessage: error => apiErrorMessage(error, 'Impossible de lire ce titre'),
				}
			),
		playPlaylist: (playlistId, startTrackId) =>
			runStep(
				asStep(call => queueApi.playPlaylist(playlistId, call, startTrackId)),
				'Play playlist',
				get().applyState,
				{ errorMessage: playPlaylistError }
			),
	};
}
