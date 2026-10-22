import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { FriendsService } from '@/features/friends/services/friends.service.js';
import { notifyListeningAccessChange } from '@/features/friends/utils/listening-access.js';
import * as controlAccessService from '@/features/music-control/services/control-access.service.js';
import type {
	ControllableDevicesResponse,
	GrantDeviceLicenseResponse,
} from '@/features/music-control/music-control.types.js';
import {
	failQuery,
	fetchLicenseUsers,
	findOwnedDevice,
	listOwnerDevices,
	toDevice,
} from '@/features/music-control/utils/device.helpers.js';

// Per-device music control licenses (`device_control_licenses`): the owner of
// a device lets a mutual friend control it.

const friendsService = new FriendsService();

/**
 * Licenses granteeId on the owner's device. Idempotent: an existing license
 * keeps its first `created_at`.
 */
export async function grant(
	ownerId: string,
	deviceId: string,
	granteeId: string
): Promise<GrantDeviceLicenseResponse> {
	if (granteeId === ownerId) {
		throw new AppError(400, 'You cannot license yourself on your own device', 'CANNOT_LICENSE_SELF');
	}
	await findOwnedDevice(ownerId, deviceId);

	const { isFriend } = await friendsService.getFollowStatus(ownerId, granteeId);
	if (!isFriend) {
		throw new AppError(400, 'You can only grant control to mutual friends', 'NOT_FRIENDS');
	}

	const context = { ownerId, deviceId, granteeId };
	const { error: upsertError } = await supabaseAdmin
		.from('device_control_licenses')
		.upsert(
			{ owner_id: ownerId, device_id: deviceId, grantee_id: granteeId },
			{ onConflict: 'owner_id,device_id,grantee_id', ignoreDuplicates: true }
		);
	if (upsertError) {
		failQuery('Failed to grant device license', 'DEVICE_LICENSE_GRANT_ERROR', upsertError, context);
	}

	const { data: license, error } = await supabaseAdmin
		.from('device_control_licenses')
		.select('created_at')
		.eq('owner_id', ownerId)
		.eq('device_id', deviceId)
		.eq('grantee_id', granteeId)
		.single();
	if (error) {
		failQuery('Failed to grant device license', 'DEVICE_LICENSE_GRANT_ERROR', error, context);
	}

	const user = (await fetchLicenseUsers([granteeId])).get(granteeId);
	if (!user) {
		logger.error('Licensed user has no profile', context);
		throw new AppError(500, 'Failed to grant device license', 'DEVICE_LICENSE_GRANT_ERROR');
	}

	logger.info('Device license granted', context);
	// The grantee's open profile of the owner reloads its controllable devices (#183).
	await notifyListeningAccessChange(granteeId, ownerId, true);
	return { deviceId, license: { user, grantedAt: license.created_at } };
}

/**
 * Removes granteeId's license on the owner's device. Idempotent: no error
 * when there is no such license (including self and non-friends).
 */
export async function revoke(ownerId: string, deviceId: string, granteeId: string): Promise<void> {
	await findOwnedDevice(ownerId, deviceId);

	const { error, count } = await supabaseAdmin
		.from('device_control_licenses')
		.delete({ count: 'exact' })
		.eq('owner_id', ownerId)
		.eq('device_id', deviceId)
		.eq('grantee_id', granteeId);
	if (error) {
		failQuery('Failed to revoke device license', 'DEVICE_LICENSE_REVOKE_ERROR', error, {
			ownerId,
			deviceId,
			granteeId,
		});
	}

	// Idempotent: nothing to tell anyone when there was no such license.
	if (!count) return;

	logger.info('Device license revoked', { ownerId, deviceId, granteeId });
	// Tell the grantee (#183); evicts it from the owner's listening room when it
	// has lost its last controllable device.
	const stillAllowed = await controlAccessService.canControlAnyDevice(granteeId, ownerId);
	await notifyListeningAccessChange(granteeId, ownerId, stillAllowed);
}

/**
 * Devices of ownerId that viewerId may control, on the shared rule of
 * control-access.service.ts. Not mutual friends answers the empty shape
 * before any device query, so nothing about ownerId leaks.
 */
export async function listControllable(
	viewerId: string,
	ownerId: string
): Promise<ControllableDevicesResponse> {
	const access = await controlAccessService.getAccess(viewerId, ownerId);
	if (access.allDevices) {
		const rows = await listOwnerDevices(ownerId);
		return {
			allDevices: true,
			devices: rows.map(row => ({ ...toDevice(row), access: 'all-devices' as const })),
		};
	}
	if (access.licensedDeviceIds.length === 0) return { allDevices: false, devices: [] };

	const rows = await listOwnerDevices(ownerId, access.licensedDeviceIds);
	return {
		allDevices: false,
		devices: rows.map(row => ({ ...toDevice(row), access: 'license' as const })),
	};
}
