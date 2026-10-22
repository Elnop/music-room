import type { DeviceInfo } from '@/features/music-control/music-control.types.js';

/**
 * Payloads of the listening and control Socket.io events (music-control-access.ts).
 */

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
	/** Playback position when the status was sent, in ms; null from older clients (#295). */
	positionMs: number | null;
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

export interface ControlActionPayload {
	targetUserId: string;
	targetDeviceId: string;
	action: 'play' | 'pause';
}

/** control:revoked: the receiver no longer controls any of ownerId's devices. */
export interface ControlRevokedPayload {
	ownerId: string;
}
