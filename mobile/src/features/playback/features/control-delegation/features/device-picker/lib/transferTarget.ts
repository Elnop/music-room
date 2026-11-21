import { connectStore } from '@/features/playback/shared/player/stores/connectStore';
import type { ConnectTarget } from '@/features/playback/shared/player/types/queueTypes';
import type { TransferDestination } from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';

export function isCurrentTarget(target: ConnectTarget, destination: TransferDestination): boolean {
	if (destination.toPhone && target.kind === 'local') return true;
	return (
		target.kind === 'remote' &&
		target.ownerId === destination.owner.ownerId &&
		target.deviceId === destination.deviceId
	);
}

export function switchTarget({ owner, deviceId, toPhone }: TransferDestination): void {
	if (toPhone) {
		connectStore.getState().setLocal();
	} else {
		connectStore.getState().setRemote({
			ownerId: owner.ownerId,
			deviceId,
			ownerUsername: owner.username,
		});
	}
}
