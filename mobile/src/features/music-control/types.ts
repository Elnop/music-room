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
import type { ListeningStatus } from '@/types/listening.types';
import type { ControlError } from '@/shared/utils/controlError';

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
} from '@/shared/services/musicControlBridge';
