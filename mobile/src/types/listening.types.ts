import type { DeviceInfo } from '@/shared/services/deviceService';

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
	/** When the status was sent; null from older clients. */
	positionMs: number | null;
	updatedAt: string;
}

export interface UserListeningStatus {
	ownerId: string;
	devices: ListeningStatus[];
}
