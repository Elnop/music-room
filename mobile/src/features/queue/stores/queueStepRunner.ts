import { getPlayback } from '@/shared/services/playbackBridge';
import { trackToSoundCloud } from '@/shared/utils/trackToSoundCloud';
import { currentItem } from '@/features/queue/utils/queueSelectors';
import { showError } from '@/shared/utils/toast';
import { logger } from '@/shared/utils/logger';
import {
	actionScope,
	handleRemoteRefusal,
	type StepOptions,
} from '@/features/queue/stores/queueScope';
import type {
	QueueCallTarget,
	QueueState,
	QueueStepOutcome,
	QueueStepResult,
} from '@/features/queue/types';

let stepPending = false;

export async function runStep(
	request: (call: QueueCallTarget) => Promise<QueueStepResult>,
	label: string,
	applyState: (state: QueueState) => void,
	options: StepOptions = {}
): Promise<QueueStepOutcome> {
	if (stepPending) return 'ignored';
	stepPending = true;
	const scope = actionScope();
	const { loadCounter } = getPlayback().getPlayerState();
	let result: QueueStepResult;
	try {
		result = await request(scope.call);
	} catch (error) {
		logger.error(`[queueStore] ${label} failed:`, error);
		if (!handleRemoteRefusal(scope, error) && options.errorMessage) {
			const msg = options.errorMessage;
			showError(typeof msg === 'function' ? msg(error) : msg);
		}
		return 'error';
	} finally {
		stepPending = false;
	}
	if (!result.ok) return 'boundary';

	applyState(result.state);
	const item = currentItem(result.state);
	if (scope.remote) return item ? 'played' : 'stopped';

	const player = getPlayback().getPlayerState();
	if (player.loadCounter !== loadCounter) return 'played';
	if (item) {
		getPlayback().playTrack(trackToSoundCloud(item), item.id);
		return 'played';
	}
	if (options.stopWhenEmpty) getPlayback().stop();
	return 'stopped';
}

export const asStep =
	(request: (call: QueueCallTarget) => Promise<QueueState>) =>
	async (call: QueueCallTarget): Promise<QueueStepResult> => ({
		ok: true,
		state: await request(call),
	});

export async function mutate(
	request: (call: QueueCallTarget) => Promise<QueueState>,
	label: string,
	applyState: (state: QueueState) => void,
	errorMessage: string | ((error: unknown) => string)
): Promise<boolean> {
	const scope = actionScope();
	try {
		applyState(await request(scope.call));
		return true;
	} catch (error) {
		logger.error(`[queueStore] ${label} failed:`, error);
		if (!handleRemoteRefusal(scope, error)) {
			showError(typeof errorMessage === 'function' ? errorMessage(error) : errorMessage);
		}
		return false;
	}
}
