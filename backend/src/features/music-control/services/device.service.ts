import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type {
	DeviceInfo,
	DeviceLicense,
	DeviceWithLicenses,
} from '@/features/music-control/music-control.types.js';
import {
	failQuery,
	fetchLicenseUsers,
	listOwnerDevices,
	toDevice,
} from '@/features/music-control/utils/device.helpers.js';

/**
 * Persists the devices a user connects from (`devices`, one row per
 * `(user_id, device_id)`).
 */
export class DeviceService {
	/**
	 * Records an authenticated connection: inserts the device or refreshes its
	 * name, platform, model and `last_seen_at`. `created_at` is left out of the
	 * payload so an existing row keeps it.
	 */
	async recordConnection(userId: string, device: DeviceInfo): Promise<void> {
		const { error } = await supabaseAdmin.from('devices').upsert(
			{
				user_id: userId,
				device_id: device.deviceId,
				device_name: device.deviceName,
				platform: device.platform,
				model: device.model,
				last_seen_at: new Date().toISOString(),
			},
			{ onConflict: 'user_id,device_id' }
		);

		if (error) {
			logger.error('Failed to record device connection', {
				userId,
				deviceId: device.deviceId,
				error: error.message,
				code: error.code,
			});
			throw new AppError(500, 'Failed to record device', 'DEVICE_REGISTRATION_FAILED');
		}
	}

	/**
	 * The owner's devices, most recently seen first, each with the friends
	 * licensed to control it (oldest grant first). A license whose grantee is no
	 * longer a mutual friend is still listed so the owner can revoke it.
	 */
	async listMyDevices(ownerId: string): Promise<DeviceWithLicenses[]> {
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
}
