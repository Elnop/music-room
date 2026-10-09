// Device Types
export interface Device {
	id: string;
	user_id: string;
	name: string;
	type: string;
	created_at: string;
}

// Music control devices (backend: features/music-control/music-control.types.ts)

/** A device the user has connected from */
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

export type DeviceAccess = 'all-devices' | 'license';

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

/** GET /api/music-control/users/:userId/devices */
export interface ControllableDevicesResponse {
	allDevices: boolean;
	devices: ControllableDevice[];
}
