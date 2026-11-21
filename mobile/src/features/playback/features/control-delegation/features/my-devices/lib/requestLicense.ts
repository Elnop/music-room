import { musicControlApi } from '@/features/playback/features/control-delegation/shared/delegation/musicControlApi';
import { showSuccess } from '@/shared/theme/lib/toast';
import { friendName } from '@/features/playback/features/control-delegation/features/my-devices/lib/devicePermissions';
import type {
	FriendUserSummary,
	UserDeviceWithLicenses,
} from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';

export async function requestLicense(
	device: UserDeviceWithLicenses,
	friend: FriendUserSummary,
	grant: boolean
): Promise<void> {
	if (grant) {
		await musicControlApi.grantDeviceLicense(device.deviceId, friend.id);
		showSuccess(`${friendName(friend)} peut contrôler ${device.deviceName}`);
	} else {
		await musicControlApi.revokeDeviceLicense(device.deviceId, friend.id);
		showSuccess(`${friendName(friend)} ne contrôle plus ${device.deviceName}`);
	}
}
