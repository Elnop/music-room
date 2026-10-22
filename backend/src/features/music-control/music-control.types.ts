/**
 * Response and domain types of music control. The device responses are
 * inferred from music-control-responses.validators.ts; request inputs are
 * inferred in music-control.validators.ts.
 */

import type { z } from 'zod';
import type { QueueItem, QueueTrack } from '@/features/queue/queue.types.js';
import type {
	controllableDeviceSchema,
	controllableDevicesSchema,
	deviceLicenseSchema,
	devicePickerSchema,
	deviceSchema,
	deviceWithLicensesSchema,
	grantDeviceLicenseResponseSchema,
} from '@/features/music-control/music-control-responses.validators.js';

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

/** A device the user has connected from (`devices` row, camelCase) */
export type Device = z.infer<typeof deviceSchema>;

/** A friend licensed to control one device */
export type DeviceLicense = z.infer<typeof deviceLicenseSchema>;

export type DeviceWithLicenses = z.infer<typeof deviceWithLicensesSchema>;

export type ControllableDevice = z.infer<typeof controllableDeviceSchema>;

/** GET /api/music-control/users/:userId/devices */
export type ControllableDevicesResponse = z.infer<typeof controllableDevicesSchema>;

/** GET /api/music-control/controllable-devices (#295): me first, then friends with at least one controllable device, by username */
export type DevicePickerResponse = z.infer<typeof devicePickerSchema>;

export type DevicePickerOwner = DevicePickerResponse['owners'][number];

/** POST /api/music-control/devices/:deviceId/licenses/:userId */
export type GrantDeviceLicenseResponse = z.infer<typeof grantDeviceLicenseResponseSchema>;

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

/** control:command: play `track` from `positionMs` (playback transfer, #295). */
export interface QueueTrackCommand {
	action: 'play-track';
	fromUserId: string;
	track: QueueTrack;
	positionMs: number;
}

/** control:command: pause the device (playback transfer, #295). */
export interface DevicePauseCommand {
	action: 'pause';
	fromUserId: string;
}

export type DeviceCommand = QueuePlayCommand | QueueTrackCommand | DevicePauseCommand;

/** control:revoked: the receiver no longer controls any of ownerId's devices. */
export interface ControlRevokedPayload {
	ownerId: string;
}
