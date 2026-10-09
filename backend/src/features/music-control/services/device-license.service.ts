import { supabaseAdmin } from '@/shared/config/supabase.js';
import { AppError } from '@/shared/middleware/error-handler.js';
import { logger } from '@/shared/utils/logger.js';
import { FriendsService } from '@/features/friends/services/friends.service.js';
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

const friendsService = new FriendsService();

/**
 * Per-device music control licenses (`device_control_licenses`): the owner of
 * a device lets a mutual friend control it.
 */
export class DeviceLicenseService {
	/**
	 * Licenses granteeId on the owner's device. Idempotent: an existing license
	 * keeps its first `created_at`.
	 */
	async grant(
		ownerId: string,
		deviceId: string,
		granteeId: string
	): Promise<GrantDeviceLicenseResponse> {
		if (granteeId === ownerId) {
			throw new AppError(
				400,
				'You cannot license yourself on your own device',
				'CANNOT_LICENSE_SELF'
			);
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
			failQuery(
				'Failed to grant device license',
				'DEVICE_LICENSE_GRANT_ERROR',
				upsertError,
				context
			);
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
		return { deviceId, license: { user, grantedAt: license.created_at } };
	}

	/**
	 * Removes granteeId's license on the owner's device. Idempotent: no error
	 * when there is no such license (including self and non-friends).
	 */
	async revoke(ownerId: string, deviceId: string, granteeId: string): Promise<void> {
		await findOwnedDevice(ownerId, deviceId);

		const { error } = await supabaseAdmin
			.from('device_control_licenses')
			.delete()
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

		logger.info('Device license revoked', { ownerId, deviceId, granteeId });
	}

	/**
	 * Devices of ownerId that viewerId may control. Not mutual friends answers
	 * the empty shape before any device query, so nothing about ownerId leaks.
	 */
	async listControllable(viewerId: string, ownerId: string): Promise<ControllableDevicesResponse> {
		const empty: ControllableDevicesResponse = { allDevices: false, devices: [] };
		if (viewerId === ownerId) return empty;

		const { isFriend } = await friendsService.getFollowStatus(viewerId, ownerId);
		if (!isFriend) return empty;

		const [followResult, licensesResult] = await Promise.all([
			supabaseAdmin
				.from('follows')
				.select('can_control_music')
				.eq('follower_id', viewerId)
				.eq('following_id', ownerId)
				.maybeSingle(),
			supabaseAdmin
				.from('device_control_licenses')
				.select('device_id')
				.eq('owner_id', ownerId)
				.eq('grantee_id', viewerId),
		]);
		const queryError = followResult.error ?? licensesResult.error;
		if (queryError) {
			failQuery('Failed to fetch controllable devices', 'DEVICE_FETCH_ERROR', queryError, {
				viewerId,
				ownerId,
			});
		}

		if (followResult.data?.can_control_music === true) {
			const rows = await listOwnerDevices(ownerId);
			return {
				allDevices: true,
				devices: rows.map(row => ({ ...toDevice(row), access: 'all-devices' as const })),
			};
		}

		const deviceIds = (licensesResult.data ?? []).map(l => l.device_id);
		if (deviceIds.length === 0) return empty;

		const rows = await listOwnerDevices(ownerId, deviceIds);
		return {
			allDevices: false,
			devices: rows.map(row => ({ ...toDevice(row), access: 'license' as const })),
		};
	}
}

export const deviceLicenseService = new DeviceLicenseService();
