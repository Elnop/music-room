import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import type { Tables } from '@/shared/types/supabase.generated.js';
import type { Device, DeviceLicense } from '@/features/music-control/music-control.types.js';

/** Columns of `devices` exposed through the API */
export const DEVICE_COLUMNS = 'device_id, device_name, custom_name, platform, model, last_seen_at';

type DeviceRow = Pick<
	Tables<'devices'>,
	'device_id' | 'device_name' | 'custom_name' | 'platform' | 'model' | 'last_seen_at'
>;

type LicenseUser = DeviceLicense['user'];

/** The API's `deviceName` is the name to show: the owner's, else the system's (#352). */
export function toDevice(row: DeviceRow): Device {
	return {
		deviceId: row.device_id,
		deviceName: row.custom_name ?? row.device_name,
		platform: row.platform,
		model: row.model,
		lastSeenAt: row.last_seen_at,
	};
}

/** Throws 500 with `code` after logging a failed query */
export function failQuery(
	message: string,
	code: string,
	error: { message: string; code?: string },
	context: Record<string, unknown>
): never {
	logger.error(message, { ...context, error: error.message, dbCode: error.code });
	throw new AppError(500, message, code);
}

/**
 * Returns the owner's device, or throws 404 DEVICE_NOT_FOUND when deviceId is
 * not one of their devices (unknown or owned by someone else).
 */
export async function findOwnedDevice(ownerId: string, deviceId: string): Promise<DeviceRow> {
	const { data, error } = await supabaseAdmin
		.from('devices')
		.select(DEVICE_COLUMNS)
		.eq('user_id', ownerId)
		.eq('device_id', deviceId)
		.maybeSingle();

	if (error) {
		failQuery('Failed to fetch device', 'DEVICE_FETCH_ERROR', error, { ownerId, deviceId });
	}
	if (!data) throw new AppError(404, 'Device not found', 'DEVICE_NOT_FOUND');
	return data;
}

/** Public profile fields of the given users, keyed by id */
export async function fetchLicenseUsers(userIds: string[]): Promise<Map<string, LicenseUser>> {
	const users = new Map<string, LicenseUser>();
	if (userIds.length === 0) return users;

	const { data, error } = await supabaseAdmin
		.from('user_profiles')
		.select('id, username, display_name, avatar_url')
		.in('id', [...new Set(userIds)]);

	if (error) {
		failQuery('Failed to fetch licensed users', 'DEVICE_LICENSE_FETCH_ERROR', error, { userIds });
	}
	for (const profile of data ?? []) {
		users.set(profile.id, {
			id: profile.id,
			username: profile.username,
			displayName: profile.display_name,
			avatarUrl: profile.avatar_url,
		});
	}
	return users;
}

/**
 * The owner's devices, most recently seen first; only those in deviceIds when
 * given.
 */
export async function listOwnerDevices(
	ownerId: string,
	deviceIds?: string[]
): Promise<DeviceRow[]> {
	let query = supabaseAdmin.from('devices').select(DEVICE_COLUMNS).eq('user_id', ownerId);
	if (deviceIds) query = query.in('device_id', deviceIds);
	const { data, error } = await query.order('last_seen_at', { ascending: false });

	if (error) failQuery('Failed to fetch devices', 'DEVICE_FETCH_ERROR', error, { ownerId });
	return data ?? [];
}
