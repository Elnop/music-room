import type {
	ControllableDevicesResponse,
	DevicePickerResponse,
	GrantDeviceLicenseResponse,
	MyDevicesResponse,
	RenameDeviceResponse,
	RevokeDeviceLicenseResponse,
	UserDevice,
	UserDeviceWithLicenses,
} from '@/shared/devices/device.types';

export type {
	ControllableDevicesResponse,
	DevicePickerResponse,
	GrantDeviceLicenseResponse,
	MyDevicesResponse,
	RenameDeviceResponse,
	RevokeDeviceLicenseResponse,
	UserDevice,
	UserDeviceWithLicenses,
};

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

export type {
	FriendDeviceStatus,
	FriendListeningResult,
} from '@/shared/backend/lib/musicControlBridge';
