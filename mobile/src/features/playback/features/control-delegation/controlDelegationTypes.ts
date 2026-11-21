import type { Dispatch, SetStateAction } from 'react';
import type { ControlError } from '@/shared/control-error/controlErrorTypes';
import type { ListeningStatus } from '@/features/playback/shared/player/types/listeningTypes';
import type { DeviceCommand } from '@/shared/playback/types/queueTypes';

export type PermissionChangedEvent = {
	ownerId: string;
	targetUserId: string;
	canControl: boolean;
};

export type ControllableIds = {
	userId: string;
	allDevices: boolean;
	ids: string[];
};

export type ControllableView = {
	allDevices: boolean;
	ids: string[];
	canControl: boolean;
};

export type ControlEventHandlers = {
	handlePermissionChanged: (data: PermissionChangedEvent) => void;
	handleControlError: (err: ControlError) => void;
};

export type ListeningState = {
	statuses: ListeningStatus[];
	isLoading: boolean;
	error: string | null;
};

export type SetListening = Dispatch<SetStateAction<ListeningState>>;

export type ControlCommand = DeviceCommand | { action: 'play'; fromUserId: string };
