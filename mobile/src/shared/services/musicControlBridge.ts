import type { ListeningStatus } from '@/types/listening.types';
import type { DevicePickerResponse } from '@/types/device.types';
import type { ControlError } from '@/shared/utils/controlError';
import { apiRequest } from './api';

export interface FriendDeviceStatus extends ListeningStatus {
	controllable: boolean;
}

export interface FriendListeningResult {
	devices: FriendDeviceStatus[];
	canControl: boolean;
	isLoading: boolean;
	error: string | null;
	controlError: ControlError | null;
	remotePlay: (targetDeviceId: string) => void;
	remotePause: (targetDeviceId: string) => void;
}

interface MusicControlBridge {
	useFriendListening: (targetUserId: string | null) => FriendListeningResult;
	getDevicePicker?: () => Promise<DevicePickerResponse>;
}

const defaultResult: FriendListeningResult = {
	devices: [],
	canControl: false,
	isLoading: false,
	error: null,
	controlError: null,
	remotePlay: () => undefined,
	remotePause: () => undefined,
};

let bridge: MusicControlBridge | null = null;

export function registerMusicControlBridge(impl: MusicControlBridge): void {
	bridge = impl;
}

export function resetMusicControlBridge(): void {
	bridge = null;
}

export function useFriendListening(targetUserId: string | null): FriendListeningResult {
	if (!bridge) return defaultResult;
	return bridge.useFriendListening(targetUserId);
}

export async function getDevicePicker(): Promise<DevicePickerResponse> {
	if (bridge?.getDevicePicker) {
		return bridge.getDevicePicker();
	}
	return apiRequest<DevicePickerResponse>('/api/music-control/controllable-devices');
}
