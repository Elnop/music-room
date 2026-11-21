import type { Coordinates, MusicEvent } from '@/features/events/eventTypes';

export type BeaconSighting = {
	rssi: number;
	measuredPower: number;
	lastSeen: number;
};

export type BeaconFrame = {
	minor: number;
	rssi: number;
	measuredPower: number;
};

export type ScannerState = 'on' | 'off' | 'unsupported';

export type BeaconScanStatus = 'checking' | 'needs-permission' | 'off' | 'unsupported' | 'scanning';

export type BeaconScan = {
	status: BeaconScanStatus;
	sightings: ReadonlyMap<number, BeaconSighting>;
	requestPermission: () => void;
};

export type PositionState =
	| { status: 'checking' }
	| { status: 'needs-permission' }
	| { status: 'denied' }
	| { status: 'disabled' }
	| { status: 'waiting' }
	| { status: 'timed-out' }
	| { status: 'located'; position: Coordinates };

export type ForegroundPosition = {
	state: PositionState;
	requestPermission: () => void;
	openSettings: () => void;
};

export type NearbyItem = {
	event: MusicEvent;
	proximity: string;
};

export type NearbyNotice = {
	message: string;
	action?: 'request' | 'settings' | 'retry';
};

export type NearbyEvents = {
	items: NearbyItem[];
	notice: NearbyNotice;
	mine: MusicEvent[];
	openEvent: (id: string) => void;
	createEvent: () => void;
	requestPermission: () => void;
	openSettings: () => void;
	beaconStatus: BeaconScanStatus;
	requestBeaconPermission: () => void;
};
