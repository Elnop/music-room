import type { DeviceInfo } from '@/shared/backend/deviceService';

export type ListeningStatus = {
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
};

export type UserListeningStatus = {
	ownerId: string;
	devices: ListeningStatus[];
};
