import { trackToSoundCloud } from '@/features/playback/shared/player/lib/trackToSoundCloud';
import { currentItem } from '@/features/playback/shared/player/lib/queueNavigation';
import { showError } from '@/shared/theme/lib/toast';
import { logger } from '@/shared/logging/logger';
import { actionScope, handleRemoteRefusal } from '@/features/playback/shared/player/lib/queueScope';
import type {
	ActionScope,
	StepOptions,
	QueueCallTarget,
	QueueState,
	QueueStepOutcome,
	QueueStepResult,
} from '@/features/playback/shared/player/types/queueTypes';
import { getPlayerState } from '@/features/playback/shared/player/lib/getPlayerState';
import { playerStore } from '@/features/playback/shared/player/stores/playerStore';

let stepPending = false;

function reportFailure(label: string, scope: ActionScope, error: unknown, options: StepOptions) {
	logger.error(`[queueStore] ${label} failed:`, error);
	if (!handleRemoteRefusal(scope, error) && options.errorMessage) {
		const msg = options.errorMessage;
		showError(typeof msg === 'function' ? msg(error) : msg);
	}
}

function playStepState(
	state: QueueState,
	scope: ActionScope,
	loadCounter: number,
	options: StepOptions,
): QueueStepOutcome {
	const item = currentItem(state);
	if (scope.remote) return item ? 'played' : 'stopped';
	if (getPlayerState().loadCounter !== loadCounter) return 'played';
	if (item) {
		playerStore.getState().playTrack(trackToSoundCloud(item), item.id);
		return 'played';
	}
	if (options.stopWhenEmpty) playerStore.getState().stop();
	return 'stopped';
}

export async function runStep(
	request: (call: QueueCallTarget) => Promise<QueueStepResult>,
	label: string,
	applyState: (state: QueueState) => void,
	options: StepOptions = {},
): Promise<QueueStepOutcome> {
	if (stepPending) return 'ignored';
	stepPending = true;
	const scope = actionScope();
	const { loadCounter } = getPlayerState();
	let result: QueueStepResult;
	try {
		result = await request(scope.call);
	} catch (error) {
		reportFailure(label, scope, error, options);
		return 'error';
	} finally {
		stepPending = false;
	}
	if (!result.ok) return 'boundary';
	applyState(result.state);
	return playStepState(result.state, scope, loadCounter, options);
}

export function asStep(request: (call: QueueCallTarget) => Promise<QueueState>) {
	return async (call: QueueCallTarget): Promise<QueueStepResult> => ({
		ok: true,
		state: await request(call),
	});
}

export async function mutate(
	request: (call: QueueCallTarget) => Promise<QueueState>,
	label: string,
	applyState: (state: QueueState) => void,
	errorMessage: string | ((error: unknown) => string),
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
