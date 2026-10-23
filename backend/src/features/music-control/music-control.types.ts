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

/** A device the user has connected from (`devices` row, camelCase) */
export type Device = z.infer<typeof deviceSchema>;

/** A friend licensed to control one device */
export type DeviceLicense = z.infer<typeof deviceLicenseSchema>;

export type DeviceWithLicenses = z.infer<typeof deviceWithLicensesSchema>;

export type ControllableDevice = z.infer<typeof controllableDeviceSchema>;

/** GET /api/music-control/users/:userId/devices */
export type ControllableDevicesResponse = z.infer<typeof controllableDevicesSchema>;

/** Me first, then friends with at least one controllable device, by username. */
export type DevicePickerResponse = z.infer<typeof devicePickerSchema>;

export type DevicePickerOwner = DevicePickerResponse['owners'][number];

export type GrantDeviceLicenseResponse = z.infer<typeof grantDeviceLicenseResponseSchema>;

/** Sent to the owner's device chosen by a queue playback action. */
export interface QueuePlayCommand {
	action: 'play-item';
	fromUserId: string;
	item: QueueItem;
	positionMs: number;
	/** Version of the queue state that made `item` current. */
	version: number;
}

export interface QueueTrackCommand {
	action: 'play-track';
	fromUserId: string;
	track: QueueTrack;
	positionMs: number;
}

export interface DevicePauseCommand {
	action: 'pause';
	fromUserId: string;
}

export type DeviceCommand = QueuePlayCommand | QueueTrackCommand | DevicePauseCommand;
