import { apiRequest } from '@/shared/backend/lib/apiRequest';
import type {
	CanControlResponse,
	ControllableDevicesResponse,
	DevicePickerResponse,
	FriendUserSummary,
	GrantDeviceLicenseResponse,
	MusicControlPermissionsResponse,
	MyDevicesResponse,
	RenameDeviceResponse,
	RevokeDeviceLicenseResponse,
	UserDevice,
	UserDeviceWithLicenses,
} from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';

function licensePath(deviceId: string, userId: string): string {
	return `/api/music-control/devices/${encodeURIComponent(deviceId)}/licenses/${encodeURIComponent(userId)}`;
}

export const musicControlApi = {
	async getMyPermissions(): Promise<string[]> {
		const data = await apiRequest<MusicControlPermissionsResponse>(
			'/api/music-control/permissions',
		);
		return data.allowedUserIds;
	},

	async canControl(userId: string): Promise<boolean> {
		try {
			const data = await apiRequest<CanControlResponse>(`/api/music-control/can-control/${userId}`);
			return data.canControl;
		} catch {
			return false;
		}
	},

	async getMyDevices(): Promise<UserDeviceWithLicenses[]> {
		const data = await apiRequest<MyDevicesResponse>('/api/music-control/devices');
		return data.devices;
	},

	async renameDevice(deviceId: string, name: string | null): Promise<UserDevice> {
		const data = await apiRequest<RenameDeviceResponse>(
			`/api/music-control/devices/${encodeURIComponent(deviceId)}`,
			{
				method: 'PATCH',
				body: JSON.stringify({ name }),
			},
		);
		return data.device;
	},

	async getControllableDevices(userId: string): Promise<ControllableDevicesResponse> {
		return apiRequest<ControllableDevicesResponse>(
			`/api/music-control/users/${encodeURIComponent(userId)}/devices`,
		);
	},

	async getFriends(): Promise<FriendUserSummary[]> {
		return apiRequest<FriendUserSummary[]>('/api/friends');
	},

	async getDevicePicker(): Promise<DevicePickerResponse> {
		return apiRequest<DevicePickerResponse>('/api/music-control/controllable-devices');
	},

	async grantDeviceLicense(deviceId: string, userId: string): Promise<GrantDeviceLicenseResponse> {
		return apiRequest<GrantDeviceLicenseResponse>(licensePath(deviceId, userId), {
			method: 'POST',
		});
	},

	async revokeDeviceLicense(
		deviceId: string,
		userId: string,
	): Promise<RevokeDeviceLicenseResponse> {
		return apiRequest<RevokeDeviceLicenseResponse>(licensePath(deviceId, userId), {
			method: 'DELETE',
		});
	},
};
