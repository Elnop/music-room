import type { DeviceInfo } from '@/features/music-control/music-control.types.js';

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

export interface ControlActionPayload {
	targetUserId: string;
	targetDeviceId: string;
	action: 'play' | 'pause';
}

export interface ControlRevokedPayload {
	ownerId: string;
}
