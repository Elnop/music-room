import type { DevicePickerOwner } from '@/features/playback/features/control-delegation/shared/delegation/types/deviceTypes';
import type { ConnectTarget } from '@/features/playback/shared/player/types/queueTypes';
import type { TransferRequest } from '@/shared/playback/types/queueTypes';

export type PickerDevice = DevicePickerOwner['devices'][number];

export type LoadedDevices = {
	owners: DevicePickerOwner[];
	phoneId: string;
};

export type DeviceListState = {
	loaded: LoadedDevices | null;
	loading: boolean;
	loadError: boolean;
};

export type DeviceList = DeviceListState & {
	retry: () => void;
};

export type PickerRow = {
	key: string;
	owner: DevicePickerOwner;
	device: PickerDevice;
	active: boolean;
	pending: boolean;
	disabled: boolean;
};

export type PickerFriendGroup = {
	owner: DevicePickerOwner;
	rows: PickerRow[];
};

export type PickerSections = {
	phone: PickerRow | null;
	myOthers: PickerRow[];
	friends: PickerFriendGroup[];
};

export type PickerSelection = {
	target: ConnectTarget;
	pendingKey: string | null;
};

export type PickerStatus = {
	loading: boolean;
	loadError: boolean;
};

export type DevicePicker = {
	status: PickerStatus;
	sections: PickerSections | null;
	onRetry: () => void;
	onPick: (row: PickerRow) => void;
};

export type TransferDestination = {
	owner: DevicePickerOwner;
	deviceId: string;
	toPhone: boolean;
};

export type TransferPlayback = {
	playing: TransferRequest['playing'];
	positionMs: number;
	source?: TransferRequest['source'];
};
