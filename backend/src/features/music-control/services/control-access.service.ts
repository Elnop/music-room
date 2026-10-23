import { supabaseAdmin } from '@/shared/config/supabase.js';
import { logger } from '@/shared/utils/logger.js';
import { failQuery } from '@/features/music-control/utils/device.helpers.js';

// Control rule: mutual friends, plus the owner's "all my devices" switch or a license on the device.
// The owner controls all of their devices. Shared by the realtime events and GET /users/{userId}/devices.

interface ControlAccess {
	/** Mutual follows */
	isFriend: boolean;
	allDevices: boolean;
	/** Empty when not friends */
	licensedDeviceIds: string[];
}

const NO_ACCESS: ControlAccess = { isFriend: false, allDevices: false, licensedDeviceIds: [] };

const SELF_ACCESS: ControlAccess = { isFriend: false, allDevices: true, licensedDeviceIds: [] };

/** Not mutual friends means no access whatever the switch or licenses; throws 500 DEVICE_FETCH_ERROR on a query error. */
export async function getAccess(controllerId: string, ownerId: string): Promise<ControlAccess> {
	if (controllerId === ownerId) return SELF_ACCESS;

	const [toOwner, toController] = await Promise.all([
		supabaseAdmin
			.from('follows')
			.select('can_control_music')
			.eq('follower_id', controllerId)
			.eq('following_id', ownerId)
			.maybeSingle(),
		supabaseAdmin
			.from('follows')
			.select('follower_id')
			.eq('follower_id', ownerId)
			.eq('following_id', controllerId)
			.maybeSingle(),
	]);
	const followError = toOwner.error ?? toController.error;
	if (followError) {
		failQuery('Failed to check control access', 'DEVICE_FETCH_ERROR', followError, {
			controllerId,
			ownerId,
		});
	}
	if (!toOwner.data || !toController.data) return NO_ACCESS;
	if (toOwner.data.can_control_music === true) {
		return { isFriend: true, allDevices: true, licensedDeviceIds: [] };
	}

	const { data, error } = await supabaseAdmin
		.from('device_control_licenses')
		.select('device_id')
		.eq('owner_id', ownerId)
		.eq('grantee_id', controllerId);
	if (error) {
		failQuery('Failed to check control access', 'DEVICE_FETCH_ERROR', error, {
			controllerId,
			ownerId,
		});
	}
	return {
		isFriend: true,
		allDevices: false,
		licensedDeviceIds: (data ?? []).map(row => row.device_id),
	};
}

/** Errors are logged and answered as no access. */
async function safeAccess(controllerId: string, ownerId: string): Promise<ControlAccess> {
	try {
		return await getAccess(controllerId, ownerId);
	} catch (error) {
		logger.error('Control access check failed, refusing', { error, controllerId, ownerId });
		return NO_ACCESS;
	}
}

/** Fails closed. */
export async function canControlDevice(
	controllerId: string,
	ownerId: string,
	deviceId: string
): Promise<boolean> {
	const access = await safeAccess(controllerId, ownerId);
	return access.allDevices || access.licensedDeviceIds.includes(deviceId);
}

/** Fails closed. */
export async function canControlAnyDevice(controllerId: string, ownerId: string): Promise<boolean> {
	const access = await safeAccess(controllerId, ownerId);
	return access.allDevices || access.licensedDeviceIds.length > 0;
}
