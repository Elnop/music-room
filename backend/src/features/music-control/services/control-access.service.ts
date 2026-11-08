import { supabaseAdmin } from '@/shared/config/supabase.js';
import { logger } from '@/shared/utils/logger.js';
import { failQuery } from '@/features/music-control/utils/device.helpers.js';

interface ControlAccess {
	allDevices: boolean;
	licensedDeviceIds: string[];
}

const NO_ACCESS: ControlAccess = { allDevices: false, licensedDeviceIds: [] };
const ALL_DEVICES: ControlAccess = { allDevices: true, licensedDeviceIds: [] };

export async function getAccess(controllerId: string, ownerId: string): Promise<ControlAccess> {
	if (controllerId === ownerId) return ALL_DEVICES;

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
	if (toOwner.data.can_control_music === true) return ALL_DEVICES;

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
	return { allDevices: false, licensedDeviceIds: (data ?? []).map(row => row.device_id) };
}

async function accessFailingClosed(controllerId: string, ownerId: string): Promise<ControlAccess> {
	try {
		return await getAccess(controllerId, ownerId);
	} catch (error) {
		logger.error('Control access check failed, refusing', { error, controllerId, ownerId });
		return NO_ACCESS;
	}
}

export async function canControlDevice(
	controllerId: string,
	ownerId: string,
	deviceId: string
): Promise<boolean> {
	const access = await accessFailingClosed(controllerId, ownerId);
	return access.allDevices || access.licensedDeviceIds.includes(deviceId);
}

export async function canControlAnyDevice(controllerId: string, ownerId: string): Promise<boolean> {
	const access = await accessFailingClosed(controllerId, ownerId);
	return access.allDevices || access.licensedDeviceIds.length > 0;
}
