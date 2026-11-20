import type { ListeningStatus } from '@/features/playback/shared/player/lib/listening.types';
import type { ControlError } from '@/shared/control-error/controlError';
import type {
	ControllableDevicesResponse,
	DevicePickerResponse,
	GrantDeviceLicenseResponse,
	MyDevicesResponse,
	RenameDeviceResponse,
	RevokeDeviceLicenseResponse,
	UserDevice,
	UserDeviceWithLicenses,
} from './device.types';

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

export interface FriendDeviceStatus extends ListeningStatus {
	controllable: boolean;
}

export interface FriendListeningResult {
	devices: FriendDeviceStatus[];
	canControl: boolean;
	isLoading: boolean;
	error: string | null;
	controlError: ControlError | null;
	remotePlay: (targetDeviceId: string) => void;
	remotePause: (targetDeviceId: string) => void;
}

export interface FriendUserSummary {
	id: string;
	username: string;
	displayName?: string | null;
	avatarUrl?: string | null;
}
