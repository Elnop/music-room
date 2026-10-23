import { apiRequest, authRequest } from '@/shared/services/api';
import type {
	CanControlResponse,
	ControlActionResponse,
	ControllableDevicesResponse,
	DevicePickerResponse,
	GrantDeviceLicenseResponse,
	MusicControlPermissionsResponse,
	MyDevicesResponse,
	RenameDeviceResponse,
	RevokeDeviceLicenseResponse,
	UserDevice,
	UserDeviceWithLicenses,
} from '@/features/music-control/types';

const licensePath = (deviceId: string, userId: string): string =>
	`/api/music-control/devices/${encodeURIComponent(deviceId)}/licenses/${encodeURIComponent(userId)}`;

function req<T>(path: string, token?: string, options: RequestInit = {}): Promise<T> {
	if (token) return authRequest<T>(path, token, options);
	return apiRequest<T>(path, options);
}

/**
 * Music Control API
 * Manages music control permissions between friends
 */
export const musicControlApi = {
	async getMyPermissions(token?: string): Promise<string[]> {
		const data = await req<MusicControlPermissionsResponse>(
			'/api/music-control/permissions',
			token
		);
		return data.allowedUserIds;
	},

	async grantControl(userId: string, token?: string): Promise<void> {
		await req<ControlActionResponse>(`/api/music-control/permissions/${userId}`, token, {
			method: 'POST',
		});
	},

	async revokeControl(userId: string, token?: string): Promise<void> {
		await req<ControlActionResponse>(`/api/music-control/permissions/${userId}`, token, {
			method: 'DELETE',
		});
	},

	async canControl(userId: string, token?: string): Promise<boolean> {
		try {
			const data = await req<CanControlResponse>(`/api/music-control/can-control/${userId}`, token);
			return data.canControl;
		} catch {
			return false;
		}
	},

	async getMyDevices(token?: string): Promise<UserDeviceWithLicenses[]> {
		const data = await req<MyDevicesResponse>('/api/music-control/devices', token);
		return data.devices;
	},

	async renameDevice(deviceId: string, name: string | null, token?: string): Promise<UserDevice> {
		const data = await req<RenameDeviceResponse>(
			`/api/music-control/devices/${encodeURIComponent(deviceId)}`,
			token,
			{
				method: 'PATCH',
				body: JSON.stringify({ name }),
			}
		);
		return data.device;
	},

	async getControllableDevices(
		userId: string,
		token?: string
	): Promise<ControllableDevicesResponse> {
		return req<ControllableDevicesResponse>(
			`/api/music-control/users/${encodeURIComponent(userId)}/devices`,
			token
		);
	},

	async getDevicePicker(token?: string): Promise<DevicePickerResponse> {
		return req<DevicePickerResponse>('/api/music-control/controllable-devices', token);
	},

	async grantDeviceLicense(
		deviceId: string,
		userId: string,
		token?: string
	): Promise<GrantDeviceLicenseResponse> {
		return req<GrantDeviceLicenseResponse>(licensePath(deviceId, userId), token, {
			method: 'POST',
		});
	},

	async revokeDeviceLicense(
		deviceId: string,
		userId: string,
		token?: string
	): Promise<RevokeDeviceLicenseResponse> {
		return req<RevokeDeviceLicenseResponse>(licensePath(deviceId, userId), token, {
			method: 'DELETE',
		});
	},
};
