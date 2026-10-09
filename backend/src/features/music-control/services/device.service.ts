import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { DeviceInfo } from '@/features/music-control/music-control.types.js';

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
}
