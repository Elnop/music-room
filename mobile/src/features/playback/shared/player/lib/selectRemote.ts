import { playerStore } from '@/features/playback/shared/player/stores/playerStore';
import type { StoreApi } from 'zustand';
import type {
	ConnectState,
	RemoteTarget,
} from '@/features/playback/shared/player/types/queueTypes';

export function selectRemote(
	set: StoreApi<ConnectState>['setState'],
	get: StoreApi<ConnectState>['getState'],
	{ ownerId, deviceId, ownerUsername }: Omit<RemoteTarget, 'kind'>,
): void {
	const { target } = get();
	if (target.kind === 'remote' && target.ownerId === ownerId && target.deviceId === deviceId) {
		if (ownerUsername !== undefined && ownerUsername !== target.ownerUsername) {
			set({ target: { ...target, ownerUsername } });
		}
		return;
	}
	playerStore.getState().stop();
	set({
		target: { kind: 'remote', ownerId, deviceId, ownerUsername },
		remoteStatus: null,
		controlPending: false,
	});
}
