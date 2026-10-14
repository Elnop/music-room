import { supabaseAdmin } from '@/shared/config/supabase.js';
import { logger } from '@/shared/utils/logger.js';
import { failQuery } from '@/features/music-control/utils/device.helpers.js';

/** What controllerId may control among ownerId's devices */
export interface ControlAccess {
	/** controllerId and ownerId follow each other */
	isFriend: boolean;
	/** The owner's "all my devices" switch is on for the controller */
	allDevices: boolean;
	/** Devices the controller holds a license on (empty when not friends) */
	licensedDeviceIds: string[];
}

const NO_ACCESS: ControlAccess = { isFriend: false, allDevices: false, licensedDeviceIds: [] };

/** The owner controls every one of their own devices (#294). */
const SELF_ACCESS: ControlAccess = { isFriend: false, allDevices: true, licensedDeviceIds: [] };

/**
 * Per-device music control rule (subject IV.2.2), shared by the realtime
 * events and `GET /users/{userId}/devices`: the controller and the owner are
 * mutual friends, and either the owner's "all my devices" switch
 * (`follows(controller → owner).can_control_music`) is on, or the controller
 * holds a license on the device (`device_control_licenses`), or the
 * controller is the owner (#294), who controls all of their devices.
 */
export class ControlAccessService {
	/**
	 * Resolves the controller's access to the owner's devices. Not mutual
	 * friends answers no access whatever the switch or licenses say. Throws
	 * a 500 DEVICE_FETCH_ERROR on a query error.
	 */
	async getAccess(controllerId: string, ownerId: string): Promise<ControlAccess> {
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

	/** Whether controllerId may control ownerId's device. Fails closed. */
	async canControlDevice(
		controllerId: string,
		ownerId: string,
		deviceId: string
	): Promise<boolean> {
		const access = await this.safeAccess(controllerId, ownerId);
		return access.allDevices || access.licensedDeviceIds.includes(deviceId);
	}

	/** Whether controllerId may control at least one of ownerId's devices. Fails closed. */
	async canControlAnyDevice(controllerId: string, ownerId: string): Promise<boolean> {
		const access = await this.safeAccess(controllerId, ownerId);
		return access.allDevices || access.licensedDeviceIds.length > 0;
	}

	/** getAccess, with any error logged and answered as no access */
	private async safeAccess(controllerId: string, ownerId: string): Promise<ControlAccess> {
		try {
			return await this.getAccess(controllerId, ownerId);
		} catch (error) {
			logger.error('Control access check failed, refusing', { error, controllerId, ownerId });
			return NO_ACCESS;
		}
	}
}

export const controlAccessService = new ControlAccessService();
