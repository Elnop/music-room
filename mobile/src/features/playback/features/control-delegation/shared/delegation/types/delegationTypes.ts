import type { ListeningStatus } from '@/features/playback/shared/player/types/listeningTypes';
import type { ControlError } from '@/shared/control-error/controlErrorTypes';
import type {
	ControllableDevicesResponse,
	DevicePickerResponse,
	GrantDeviceLicenseResponse,
	MyDevicesResponse,
	RenameDeviceResponse,
	RevokeDeviceLicenseResponse,
	UserDevice,
	UserDeviceWithLicenses,
} from '@/features/playback/features/control-delegation/shared/delegation/types/deviceTypes';

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

export type MusicControlPermissionsResponse = {
	allowedUserIds: string[];
};

export type CanControlResponse = {
	canControl: boolean;
	targetUserId: string;
};

export type ControlActionResponse = {
	success: boolean;
	allowedUserId: string;
};

export type FriendDeviceStatus = ListeningStatus & {
	controllable: boolean;
};

export type FriendListeningResult = {
	devices: FriendDeviceStatus[];
	canControl: boolean;
	isLoading: boolean;
	error: string | null;
	controlError: ControlError | null;
	remotePlay: (targetDeviceId: string) => void;
	remotePause: (targetDeviceId: string) => void;
};

export type FriendUserSummary = {
	id: string;
	username: string;
	displayName?: string | null;
	avatarUrl?: string | null;
};
