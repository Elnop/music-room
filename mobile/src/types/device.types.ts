export interface UserDevice {
	deviceId: string;
	deviceName: string;
	platform: string;
	model: string;
	lastSeenAt: string;
}

export interface DeviceLicense {
	user: {
		id: string;
		username: string;
		displayName: string | null;
		avatarUrl: string | null;
	};
	grantedAt: string;
}

export interface UserDeviceWithLicenses extends UserDevice {
	licenses: DeviceLicense[];
}

type DeviceAccess = 'all-devices' | 'license';

export interface ControllableDevice extends UserDevice {
	access: DeviceAccess;
}

export interface MyDevicesResponse {
	devices: UserDeviceWithLicenses[];
}

export interface GrantDeviceLicenseResponse {
	deviceId: string;
	license: DeviceLicense;
}

export interface RevokeDeviceLicenseResponse {
	message: string;
}

export interface RenameDeviceResponse {
	device: UserDevice;
}

export interface ControllableDevicesResponse {
	allDevices: boolean;
	devices: ControllableDevice[];
}

export interface DevicePickerOwner {
	ownerId: string;
	username: string;
	isSelf: boolean;
	devices: Array<ControllableDevice & { online: boolean }>;
}

export interface DevicePickerResponse {
	owners: DevicePickerOwner[];
}

export interface ControlRevokedPayload {
	ownerId: string;
}
