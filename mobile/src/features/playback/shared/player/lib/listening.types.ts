import type { DeviceInfo } from '@/shared/backend/deviceService';

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
	positionMs: number | null;
	updatedAt: string;
}

export interface UserListeningStatus {
	ownerId: string;
	devices: ListeningStatus[];
}
