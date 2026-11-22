import { queueApi } from '@/features/playback/shared/player/lib/queueApi';
import { deviceService } from '@/shared/backend/deviceService';
import { getSession } from '@/shared/backend/lib/authSession';
import { queueStore } from '@/features/playback/shared/player/stores/queueStore';
import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import { showError } from '@/shared/theme/lib/toast';
import { hapticSuccess } from '@/shared/theme/lib/haptics';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { currentPlayback } from '@/features/playback/features/control-delegation/features/device-picker/lib/currentPlayback';
import {
	isCurrentTarget,
	switchTarget,
} from '@/features/playback/features/control-delegation/features/device-picker/lib/transferTarget';
import type { DevicePickerOwner } from '@/features/playback/features/control-delegation/shared/delegation/types/deviceTypes';
import type {
	TransferDestination,
	TransferPlayback,
} from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';

async function sendTransfer(
	destination: TransferDestination,
	playback: TransferPlayback,
): Promise<boolean> {
	try {
		const result = await queueApi.transfer({
			targetUserId: destination.owner.ownerId,
			targetDeviceId: destination.deviceId,
			positionMs: playback.positionMs,
			playing: playback.playing,
			...(playback.source ? { source: playback.source } : {}),
		});
		switchTarget(destination);
		hapticSuccess();
		if (result.queue) queueStore.getState().applyState(result.queue);
		return true;
	} catch (error) {
		logger.error('[transferPlayback] Transfer failed:', error);
		showError(apiErrorMessage(error, 'Impossible de transférer la lecture'));
		return false;
	}
}

export async function transferTo(owner: DevicePickerOwner, deviceId: string): Promise<boolean> {
	const me = getSession().user?.id ?? null;
	const { target } = connectStore.getState();
	const phoneId = (await deviceService.getDeviceInfo()).deviceId;
	const destination = { owner, deviceId, toPhone: owner.isSelf && deviceId === phoneId };
	if (isCurrentTarget(target, destination)) return true;
	const playback = currentPlayback(target, me);
	if (!playback) {
		switchTarget(destination);
		hapticSuccess();
		return true;
	}
	if (playback === 'untransferable') {
		showError('Ce titre ne peut pas être transféré');
		return false;
	}
	return sendTransfer(destination, playback);
}
