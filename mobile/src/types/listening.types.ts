import type { DeviceInfo } from '@/services/deviceService';

/**
 * Listening status of one device, as `listening:status` carries it
 * (backend `music-control.types.ts`).
 */
export interface ListeningStatus {
	ownerId: string;
	device: DeviceInfo;
	track: {
		/** Player track id; for a queue item, `hashStringToNumber(trackUri)`. */
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
 */
export interface UserListeningStatus {
	ownerId: string;
	devices: ListeningStatus[];
}
