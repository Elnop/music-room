import { queueApi } from '@/features/playback/shared/player/lib/queueApi';
import { useConnectStore } from '@/features/playback/shared/player/stores/connectStore';
import { actionScope, handleRemoteRefusal } from '@/features/playback/shared/player/lib/queueScope';
import { asStep, mutate, runStep } from '@/features/playback/shared/player/lib/queueStepRunner';
import { toTrackInput } from '@/shared/tracks/lib/toTrackInput';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError, showInfo, showSuccess } from '@/shared/theme/lib/toast';
import { hapticSuccess } from '@/shared/theme/lib/haptics';
import { logger } from '@/shared/logging/logger';
import type { QueueState } from '@/features/playback/shared/player/lib/queue.types';
import type { AddQueueItemBody } from '@/shared/playback/types/playbackTypes';
import type { SoundCloudTrack } from '@/shared/tracks/types/soundcloudTypes';
import {
	getPlayerState,
	usePlayerStore,
} from '@/features/playback/shared/player/stores/playerStore';

export async function addItemAction(
	track: AddQueueItemBody,
	applyState: (state: QueueState) => void
): Promise<boolean> {
	const added = await mutate(
		call => queueApi.addItem(track, call),
		'Add',
		applyState,
		error => apiErrorMessage(error, "Impossible d'ajouter à la file d'attente")
	);
	if (added) {
		showSuccess("Ajouté à la file d'attente");
		hapticSuccess();
	}
	return added;
}

export async function playNextAction(
	track: AddQueueItemBody,
	applyState: (state: QueueState) => void
): Promise<boolean> {
	const added = await mutate(
		call => queueApi.addItem({ ...track, next: true }, call),
		'Play next',
		applyState,
		error => apiErrorMessage(error, "Impossible d'ajouter ce titre")
	);
	if (added) {
		showSuccess('Lira ensuite');
		hapticSuccess();
	}
	return added;
}

export async function removeItemAction(
	itemId: string,
	applyState: (state: QueueState) => void
): Promise<boolean> {
	const errorMessage = 'Impossible de retirer ce titre';
	const { queueItemId } = getPlayerState();
	if (useConnectStore.getState().target.kind === 'local' && queueItemId === itemId) {
		const outcome = await runStep(
			asStep(call => queueApi.removeItem(itemId, call)),
			'Remove current item',
			applyState,
			{ errorMessage, stopWhenEmpty: true }
		);
		if (outcome === 'ignored') showInfo('Une action est déjà en cours');
		return outcome === 'played' || outcome === 'stopped';
	}
	return mutate(call => queueApi.removeItem(itemId, call), 'Remove item', applyState, errorMessage);
}

export async function playListTrackAction(
	track: SoundCloudTrack,
	applyState: (state: QueueState) => void
): Promise<void> {
	const { target } = useConnectStore.getState();
	if (target.kind === 'local') {
		usePlayerStore.getState().playTrack(track);
		return;
	}
	const scope = actionScope();
	try {
		const result = await queueApi.transfer({
			targetUserId: target.ownerId,
			targetDeviceId: target.deviceId,
			positionMs: 0,
			playing: { track: toTrackInput(track) },
		});
		if (result.queue) applyState(result.queue);
	} catch (error) {
		logger.error('[queueStore] Play list track on remote device failed:', error);
		if (!handleRemoteRefusal(scope, error)) {
			showError(apiErrorMessage(error, 'Impossible de lire ce titre'));
		}
	}
}
