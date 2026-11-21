export type UserDevice = {
	deviceId: string;
	deviceName: string;
	platform: string;
	model: string;
	lastSeenAt: string;
};

export type DeviceLicense = {
	user: {
		id: string;
		username: string;
		displayName: string | null;
		avatarUrl: string | null;
	};
	grantedAt: string;
};

export type UserDeviceWithLicenses = UserDevice & {
	licenses: DeviceLicense[];
};

type DeviceAccess = 'all-devices' | 'license';

export type ControllableDevice = UserDevice & {
	access: DeviceAccess;
};

export type MyDevicesResponse = {
	devices: UserDeviceWithLicenses[];
};

export type GrantDeviceLicenseResponse = {
	deviceId: string;
	license: DeviceLicense;
};

export type RevokeDeviceLicenseResponse = {
	message: string;
};

export type RenameDeviceResponse = {
	device: UserDevice;
};

export type ControllableDevicesResponse = {
	allDevices: boolean;
	devices: ControllableDevice[];
};

export type DevicePickerOwner = {
	ownerId: string;
	username: string;
	isSelf: boolean;
	devices: Array<ControllableDevice & { online: boolean }>;
};

export type DevicePickerResponse = {
	owners: DevicePickerOwner[];
};

export type ControlRevokedPayload = {
	ownerId: string;
};
