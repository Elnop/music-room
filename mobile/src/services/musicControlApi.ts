import { useAuthStore } from '@/store/authStore';
import { apiRequest } from '@services/api';
import type {
	ControllableDevicesResponse,
	DevicePickerResponse,
	GrantDeviceLicenseResponse,
	MyDevicesResponse,
	RenameDeviceResponse,
	RevokeDeviceLicenseResponse,
	UserDevice,
	UserDeviceWithLicenses,
} from '@/types/device.types';

export interface MusicControlPermissionsResponse {
	allowedUserIds: string[];
}

export interface CanControlResponse {
	canControl: boolean;
	targetUserId: string;
}

export interface ControlActionResponse {
	success: boolean;
	allowedUserId: string;
}

const getAuthToken = async (): Promise<string> => {
	const token = useAuthStore.getState().accessToken;
	if (!token) throw new Error('Non authentifié');
	return token;
};

const authHeaders = async (): Promise<Record<string, string>> => ({
	Authorization: `Bearer ${await getAuthToken()}`,
});

const licensePath = (deviceId: string, userId: string): string =>
	`/api/music-control/devices/${encodeURIComponent(deviceId)}/licenses/${encodeURIComponent(userId)}`;

/**
 * Music Control API
 * Manages music control permissions between friends
 */
export const musicControlApi = {
	/**
	 * Get list of users that I have granted control to
	 */
	async getMyPermissions(): Promise<string[]> {
		const data = await apiRequest<MusicControlPermissionsResponse>(
			'/api/music-control/permissions',
			{ headers: await authHeaders() }
		);
		return data.allowedUserIds;
	},

	/**
	 * Grant control permission to a friend
	 */
	async grantControl(userId: string): Promise<void> {
		await apiRequest<ControlActionResponse>(`/api/music-control/permissions/${userId}`, {
			method: 'POST',
			headers: await authHeaders(),
		});
	},

	/**
	 * Revoke control permission from a user
	 */
	async revokeControl(userId: string): Promise<void> {
		await apiRequest<ControlActionResponse>(`/api/music-control/permissions/${userId}`, {
			method: 'DELETE',
			headers: await authHeaders(),
		});
	},

	/**
	 * Check if a user has granted me control
	 */
	async canControl(userId: string): Promise<boolean> {
		try {
			const data = await apiRequest<CanControlResponse>(
				`/api/music-control/can-control/${userId}`,
				{ headers: await authHeaders() }
			);
			return data.canControl;
		} catch {
			// If error, assume no control
			return false;
		}
	},

	/**
	 * List my devices with the friends licensed on each
	 */
	async getMyDevices(): Promise<UserDeviceWithLicenses[]> {
		const data = await apiRequest<MyDevicesResponse>('/api/music-control/devices', {
			headers: await authHeaders(),
		});
		return data.devices;
	},

	/**
	 * Rename one of my devices (#352); null goes back to the name the system gives
	 */
	async renameDevice(deviceId: string, name: string | null): Promise<UserDevice> {
		const data = await apiRequest<RenameDeviceResponse>(
			`/api/music-control/devices/${encodeURIComponent(deviceId)}`,
			{
				method: 'PATCH',
				headers: await authHeaders(),
				body: JSON.stringify({ name }),
			}
		);
		return data.device;
	},

	/**
	 * List the devices of a user that I may control (all-devices switch or per-device license)
	 */
	async getControllableDevices(userId: string): Promise<ControllableDevicesResponse> {
		return apiRequest<ControllableDevicesResponse>(
			`/api/music-control/users/${encodeURIComponent(userId)}/devices`,
			{ headers: await authHeaders() }
		);
	},

	/**
	 * Devices the player can play on (#298): mine, then my friends' I may control, with their online state
	 */
	async getDevicePicker(): Promise<DevicePickerResponse> {
		return apiRequest<DevicePickerResponse>('/api/music-control/controllable-devices', {
			headers: await authHeaders(),
		});
	},

	/**
	 * Grant a friend control of one of my devices
	 */
	async grantDeviceLicense(deviceId: string, userId: string): Promise<GrantDeviceLicenseResponse> {
		return apiRequest<GrantDeviceLicenseResponse>(licensePath(deviceId, userId), {
			method: 'POST',
			headers: await authHeaders(),
		});
	},

	/**
	 * Revoke a friend's control of one of my devices
	 */
	async revokeDeviceLicense(
		deviceId: string,
		userId: string
	): Promise<RevokeDeviceLicenseResponse> {
		return apiRequest<RevokeDeviceLicenseResponse>(licensePath(deviceId, userId), {
			method: 'DELETE',
			headers: await authHeaders(),
		});
	},
};
