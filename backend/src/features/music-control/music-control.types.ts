/**
 * Music Control Types
 */

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
