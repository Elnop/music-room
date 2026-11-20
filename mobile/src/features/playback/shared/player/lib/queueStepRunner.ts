import { trackToSoundCloud } from './trackToSoundCloud';
import { currentItem } from './queueSelectors';
import { showError } from '@/shared/theme/lib/toast';
import { logger } from '@/shared/logging/logger';
import { actionScope, handleRemoteRefusal, type StepOptions } from './queueScope';
import type { QueueCallTarget, QueueState, QueueStepOutcome, QueueStepResult } from './queue.types';
import {
	getPlayerState,
	usePlayerStore,
} from '@/features/playback/shared/player/stores/playerStore';

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
	const { loadCounter } = getPlayerState();
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

	const player = getPlayerState();
	if (player.loadCounter !== loadCounter) return 'played';
	if (item) {
		usePlayerStore.getState().playTrack(trackToSoundCloud(item), item.id);
		return 'played';
	}
	if (options.stopWhenEmpty) usePlayerStore.getState().stop();
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
