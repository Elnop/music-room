import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type {
	Device,
	DeviceInfo,
	DeviceLicense,
	DeviceWithLicenses,
} from '@/features/music-control/music-control.types.js';
import {
	DEVICE_COLUMNS,
	failQuery,
	fetchLicenseUsers,
	listOwnerDevices,
	toDevice,
} from '@/features/music-control/utils/device.helpers.js';

export async function recordConnection(userId: string, device: DeviceInfo): Promise<string> {
	const { data, error } = await supabaseAdmin
		.from('devices')
		.upsert(
			{
				user_id: userId,
				device_id: device.deviceId,
				device_name: device.deviceName,
				platform: device.platform,
				model: device.model,
				last_seen_at: new Date().toISOString(),
			},
			{ onConflict: 'user_id,device_id' }
		)
		.select('custom_name')
		.single();

	if (error) {
		logger.error('Failed to record device connection', {
			userId,
			deviceId: device.deviceId,
			error: error.message,
			code: error.code,
		});
		throw new AppError(500, 'Failed to record device', 'DEVICE_REGISTRATION_FAILED');
	}
	return data.custom_name ?? device.deviceName;
}

export async function renameDevice(
	ownerId: string,
	deviceId: string,
	name: string | null
): Promise<Device> {
	const { data, error } = await supabaseAdmin
		.from('devices')
		.update({ custom_name: name })
		.eq('user_id', ownerId)
		.eq('device_id', deviceId)
		.select(DEVICE_COLUMNS)
		.maybeSingle();

	if (error) {
		failQuery('Failed to rename device', 'DEVICE_RENAME_ERROR', error, { ownerId, deviceId });
	}
	if (!data) throw new AppError(404, 'Device not found', 'DEVICE_NOT_FOUND');
	return toDevice(data);
}

export async function listMyDevices(ownerId: string): Promise<DeviceWithLicenses[]> {
	const [devices, licensesResult] = await Promise.all([
		listOwnerDevices(ownerId),
		supabaseAdmin
			.from('device_control_licenses')
			.select('device_id, grantee_id, created_at')
			.eq('owner_id', ownerId)
			.order('created_at', { ascending: true }),
	]);

	if (licensesResult.error) {
		failQuery(
			'Failed to fetch device licenses',
			'DEVICE_LICENSE_FETCH_ERROR',
			licensesResult.error,
			{ ownerId }
		);
	}

	const licenses = licensesResult.data ?? [];
	const users = await fetchLicenseUsers(licenses.map(l => l.grantee_id));

	const byDevice = new Map<string, DeviceLicense[]>();
	for (const license of licenses) {
		const user = users.get(license.grantee_id);
		if (!user) continue;
		const list = byDevice.get(license.device_id) ?? [];
		list.push({ user, grantedAt: license.created_at });
		byDevice.set(license.device_id, list);
	}

	return devices.map(row => ({
		...toDevice(row),
		licenses: byDevice.get(row.device_id) ?? [],
	}));
}
