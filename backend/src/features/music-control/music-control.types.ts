/**
 * Music Control Types
 */

import type { QueueItem } from '@/features/queue/queue.types.js';

/**
 * Device information for multi-device support
 */
export interface DeviceInfo {
	deviceId: string;
	deviceName: string;
	platform: string;
	model: string;
}

/**
 * Listening status for a single device
 */
export interface ListeningStatus {
	ownerId: string;
	device: DeviceInfo;
	track: {
		id: number;
		title: string;
		artist: string;
		artworkUrl: string | null;
	} | null;
	isPlaying: boolean;
	updatedAt: string;
}

/**
 * Aggregated listening status for a user (all devices)
 * Used for broadcasting to subscribers
 */
export interface UserListeningStatus {
	ownerId: string;
	devices: ListeningStatus[];
}

export interface MusicControlPermission {
	ownerId: string; // The user who grants permission (following_id in follows)
	allowedUserId: string; // The user who can control (follower_id in follows)
	canControl: boolean;
}

export interface ControlActionPayload {
	targetUserId: string;
	targetDeviceId: string;
	action: 'play' | 'pause';
}

export interface GrantControlResponse {
	success: boolean;
	allowedUserId: string;
}

export interface RevokeControlResponse {
	success: boolean;
	allowedUserId: string;
}

export interface PermissionChangePayload {
	ownerId: string;
	targetUserId: string;
	canControl: boolean;
}

/**
 * A device the user has connected from (`devices` row, camelCase)
 */
export interface Device {
	deviceId: string;
	deviceName: string;
	platform: string;
	model: string;
	lastSeenAt: string;
}

/**
 * A friend licensed to control one device
 */
export interface DeviceLicense {
	user: {
		id: string;
		username: string;
		displayName: string | null;
		avatarUrl: string | null;
	};
	grantedAt: string;
}

export interface DeviceWithLicenses extends Device {
	licenses: DeviceLicense[];
}

export type DeviceAccess = 'all-devices' | 'license';

export interface ControllableDevice extends Device {
	access: DeviceAccess;
}

/** GET /api/music-control/devices */
export interface MyDevicesResponse {
	devices: DeviceWithLicenses[];
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

/**
 * control:command sent by the server to the owner's device chosen by a
 * playback action on the queue (#294): play `item` from `positionMs`.
 */
export interface QueuePlayCommand {
	action: 'play-item';
	fromUserId: string;
	item: QueueItem;
	positionMs: number;
	/** Version of the queue state that made `item` current. */
	version: number;
}

/** control:revoked: the receiver no longer controls any of ownerId's devices. */
export interface ControlRevokedPayload {
	ownerId: string;
}
