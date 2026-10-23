// Mirrors backend features/music-control/music-control.types.ts

export interface UserDevice {
	deviceId: string;
	deviceName: string;
	platform: string;
	model: string;
	lastSeenAt: string;
}

/** A friend licensed to control one device */
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

/** GET /api/music-control/devices */
export interface MyDevicesResponse {
	devices: UserDeviceWithLicenses[];
}

/** POST /api/music-control/devices/:deviceId/licenses/:userId */
export interface GrantDeviceLicenseResponse {
	deviceId: string;
	license: DeviceLicense;
}

/** DELETE /api/music-control/devices/:deviceId/licenses/:userId */
export interface RevokeDeviceLicenseResponse {
	message: string;
}

/** PATCH /api/music-control/devices/:deviceId */
export interface RenameDeviceResponse {
	device: UserDevice;
}

/** GET /api/music-control/users/:userId/devices */
export interface ControllableDevicesResponse {
	allDevices: boolean;
	devices: ControllableDevice[];
}

/** GET /api/music-control/controllable-devices */
export interface DevicePickerOwner {
	ownerId: string;
	username: string;
	isSelf: boolean;
	devices: Array<ControllableDevice & { online: boolean }>;
}

export interface DevicePickerResponse {
	/** Me first, then friends with at least one controllable device, by username */
	owners: DevicePickerOwner[];
}

/** control:revoked: the receiver no longer controls any of ownerId's devices. */
export interface ControlRevokedPayload {
	ownerId: string;
}
