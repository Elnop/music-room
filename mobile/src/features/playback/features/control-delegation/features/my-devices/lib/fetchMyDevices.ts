import { getSession } from '@/shared/backend/lib/authSession';
import { deviceService } from '@/shared/backend/deviceService';
import { musicControlApi } from '@/features/playback/features/control-delegation/shared/delegation/musicControlApi';
import { licensedPairs } from '@/features/playback/features/control-delegation/features/my-devices/lib/devicePermissions';
import { LOAD_ERROR } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesConfig';
import type { MyDevicesData } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

export async function fetchMyDevices(): Promise<MyDevicesData> {
	const accessToken = getSession().accessToken;
	if (!accessToken) throw new Error(LOAD_ERROR);
	const [myDevices, myFriends, allowedIds, deviceInfo] = await Promise.all([
		musicControlApi.getMyDevices(),
		musicControlApi.getFriends(accessToken),
		musicControlApi.getMyPermissions(),
		deviceService.getDeviceInfo().catch(() => null),
	]);
	return {
		devices: myDevices,
		friends: myFriends,
		allDevicesFriendIds: new Set(allowedIds),
		currentDeviceId: deviceInfo?.deviceId ?? null,
		licensed: licensedPairs(myDevices),
	};
}
