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

export interface DeviceInfo {
	deviceId: string;
	deviceName: string;
	platform: string;
	model: string;
}

export type Device = z.infer<typeof deviceSchema>;

export type DeviceLicense = z.infer<typeof deviceLicenseSchema>;

export type DeviceWithLicenses = z.infer<typeof deviceWithLicensesSchema>;

export type ControllableDevice = z.infer<typeof controllableDeviceSchema>;

export type ControllableDevicesResponse = z.infer<typeof controllableDevicesSchema>;

export type DevicePickerResponse = z.infer<typeof devicePickerSchema>;

export type DevicePickerOwner = DevicePickerResponse['owners'][number];

export type GrantDeviceLicenseResponse = z.infer<typeof grantDeviceLicenseResponseSchema>;

export interface QueuePlayCommand {
	action: 'play-item';
	fromUserId: string;
	item: QueueItem;
	positionMs: number;
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
