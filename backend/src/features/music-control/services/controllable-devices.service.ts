import { supabaseAdmin } from '@/shared/config/supabase.js';
import * as mutualFriendsService from '@/features/friends/services/mutual-friends.service.js';
import * as deviceLicenseService from '@/features/music-control/services/device-license.service.js';
import {
	failQuery,
	listOwnerDevices,
	toDevice,
} from '@/features/music-control/utils/device.helpers.js';
import type {
	ControllableDevice,
	DevicePickerOwner,
	DevicePickerResponse,
} from '@/features/music-control/music-control.types.js';

async function fetchUsername(userId: string): Promise<string> {
	const { data, error } = await supabaseAdmin
		.from('user_profiles')
		.select('username')
		.eq('id', userId)
		.single();
	if (error) {
		failQuery('Failed to fetch profile', 'PROFILE_FETCH_ERROR', error, { userId });
	}
	return data.username;
}

/** Mine first, then friends'. */
export async function list(viewerId: string): Promise<DevicePickerResponse> {
	// Lazy: loading realtime here at import time would close a cycle
	// realtime -> music-control -> realtime.
	const realtime = await import('@/realtime/emitters/control.emitters.js');
	const withOnline = (ownerId: string, devices: ControllableDevice[]) =>
		devices.map(d => ({ ...d, online: realtime.isDeviceOnline(ownerId, d.deviceId) }));

	const [username, myRows, friends] = await Promise.all([
		fetchUsername(viewerId),
		listOwnerDevices(viewerId),
		mutualFriendsService.getMutualFriends(viewerId),
	]);

	const self: DevicePickerOwner = {
		ownerId: viewerId,
		username,
		isSelf: true,
		devices: withOnline(
			viewerId,
			myRows.map(row => ({ ...toDevice(row), access: 'all-devices' as const }))
		),
	};

	const friendOwners = await Promise.all(
		friends.map(async friend => {
			const { devices } = await deviceLicenseService.listControllable(viewerId, friend.id);
			return {
				ownerId: friend.id,
				username: friend.username,
				isSelf: false,
				devices: withOnline(friend.id, devices),
			};
		})
	);

	const owners = friendOwners
		.filter(o => o.devices.length > 0)
		.sort((a, b) => a.username.localeCompare(b.username));
	return { owners: [self, ...owners] };
}
