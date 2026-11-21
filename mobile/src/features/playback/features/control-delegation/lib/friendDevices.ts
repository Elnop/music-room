import type { ListeningStatus } from '@/features/playback/shared/player/types/listeningTypes';
import type { FriendDeviceStatus } from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';

export function friendDevices(
	statuses: ListeningStatus[],
	canControl: boolean,
	isControllable: (deviceId: string) => boolean
): FriendDeviceStatus[] {
	if (!canControl) return [];
	return statuses.map(status => ({
		...status,
		controllable: isControllable(status.device.deviceId),
	}));
}
