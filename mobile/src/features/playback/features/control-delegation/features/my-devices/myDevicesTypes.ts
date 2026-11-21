import type {
	FriendUserSummary,
	UserDeviceWithLicenses,
} from '@/features/playback/features/control-delegation/shared/delegation/types/delegationTypes';

export type MyDevicesData = {
	devices: UserDeviceWithLicenses[];
	friends: FriendUserSummary[];
	allDevicesFriendIds: Set<string>;
	currentDeviceId: string | null;
	licensed: Set<string>;
};

export type MyDevicesStatus = {
	isLoading: boolean;
	loadFailed: boolean;
	isRefreshing: boolean;
};

export type MyDevicesState = MyDevicesStatus & { data: MyDevicesData };

export type PairUpdate = (pairs: Set<string>) => Set<string>;

export type DeviceAccess = {
	friends: FriendUserSummary[];
	allDevicesFriendIds: Set<string>;
	licensed: Set<string>;
	pending: Set<string>;
};

export type FriendLicense = {
	friend: FriendUserSummary;
	key: string;
	value: boolean;
	disabled: boolean;
	isPending: boolean;
	allDevices: boolean;
};

export type DeviceActions = {
	onRefresh: () => void;
	onToggle: (device: UserDeviceWithLicenses, friend: FriendUserSummary, grant: boolean) => void;
	onOpenRename: (device: UserDeviceWithLicenses) => void;
	onNavigateFriends: () => void;
};

export type RenameState = {
	device: UserDeviceWithLicenses | null;
	saving: boolean;
};

export type RenameForm = {
	name: string;
	error?: string;
	onChangeName: (name: string) => void;
	onSave: () => void;
	onReset: () => void;
};
