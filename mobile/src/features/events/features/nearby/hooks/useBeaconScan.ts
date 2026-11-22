import { useCallback, useEffect, useState } from 'react';
import {
	BEACON_PRUNE_MS,
	BEACON_TIMEOUT_MS,
} from '@/features/events/features/nearby/configs/nearbyConfig';
import { useScreenActive } from '@/features/events/features/nearby/hooks/useScreenActive';
import {
	scanEventBeacons,
	watchBluetoothState,
} from '@/features/events/features/nearby/lib/beaconScanner';
import {
	hasScanPermission,
	requestScanPermission,
} from '@/features/events/features/nearby/lib/scanPermission';
import {
	pruneSightings,
	recordSighting,
} from '@/features/events/features/nearby/lib/beaconDistance';
import type {
	BeaconScan,
	BeaconScanStatus,
	BeaconSighting,
	ScannerState,
} from '@/features/events/features/nearby/nearbyTypes';

const NONE: ReadonlyMap<number, BeaconSighting> = new Map();

function useScanPermission(running: boolean) {
	const [permitted, setPermitted] = useState<boolean | null>(null);

	useEffect(() => {
		if (!running) return;
		void hasScanPermission().then(setPermitted);
	}, [running]);

	const requestPermission = useCallback(() => {
		void requestScanPermission().then(setPermitted);
	}, []);

	return { permitted, requestPermission };
}

function useBluetoothState(watching: boolean): ScannerState | null {
	const [bluetooth, setBluetooth] = useState<ScannerState | null>(null);

	useEffect(() => {
		if (!watching) return undefined;
		return watchBluetoothState(setBluetooth);
	}, [watching]);

	return bluetooth;
}

function useSightings(scanning: boolean): ReadonlyMap<number, BeaconSighting> {
	const [sightings, setSightings] = useState(NONE);

	useEffect(() => {
		if (!scanning) return undefined;
		const stopScan = scanEventBeacons((frame) =>
			setSightings((current) => recordSighting(current, frame.minor, frame, Date.now())),
		);
		const pruning = setInterval(
			() => setSightings((current) => pruneSightings(current, Date.now(), BEACON_TIMEOUT_MS)),
			BEACON_PRUNE_MS,
		);
		return () => {
			clearInterval(pruning);
			stopScan();
			setSightings(NONE);
		};
	}, [scanning]);

	return sightings;
}

function scanStatus(
	permitted: boolean | null,
	bluetooth: ScannerState | null,
	scanning: boolean,
): BeaconScanStatus {
	if (permitted === false) return 'needs-permission';
	if (bluetooth === 'off' || bluetooth === 'unsupported') return bluetooth;
	return scanning ? 'scanning' : 'checking';
}

export function useBeaconScan(): BeaconScan {
	const running = useScreenActive();
	const permission = useScanPermission(running);
	const bluetooth = useBluetoothState(running && permission.permitted === true);
	const scanning = running && permission.permitted === true && bluetooth === 'on';
	const sightings = useSightings(scanning);

	return {
		status: scanStatus(permission.permitted, bluetooth, scanning),
		sightings,
		requestPermission: permission.requestPermission,
	};
}
