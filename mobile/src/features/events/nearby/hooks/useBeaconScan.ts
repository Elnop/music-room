import { useCallback, useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { BEACON_PRUNE_MS, BEACON_TIMEOUT_MS } from '@/features/events/constants';
import { useAppActive } from '@/features/events/hooks/useAppActive';
import * as beaconScanner from '@/features/events/services/beaconScanner';
import {
	pruneSightings,
	recordSighting,
	type BeaconSighting,
} from '@/features/events/utils/beaconDistance';

export type BeaconScanStatus = 'checking' | 'needs-permission' | 'off' | 'unsupported' | 'scanning';

interface BeaconScan {
	status: BeaconScanStatus;
	/** Heard Zumik beacons by minor. */
	sightings: ReadonlyMap<number, BeaconSighting>;
	requestPermission: () => void;
}

const NONE: ReadonlyMap<number, BeaconSighting> = new Map();

/** Scans only while the screen is shown and the app in the foreground, to spare the battery. */
export function useBeaconScan(): BeaconScan {
	const isFocused = useIsFocused();
	const appActive = useAppActive();
	const running = isFocused && appActive;
	const [permitted, setPermitted] = useState<boolean | null>(null);
	const [bluetooth, setBluetooth] = useState<beaconScanner.ScannerState | null>(null);
	const [sightings, setSightings] = useState(NONE);

	useEffect(() => {
		if (!running) return;
		void beaconScanner.hasScanPermission().then(setPermitted);
	}, [running]);

	useEffect(() => {
		if (!running || !permitted) return undefined;
		return beaconScanner.watchBluetoothState(setBluetooth);
	}, [running, permitted]);

	const scanning = running && permitted === true && bluetooth === 'on';
	useEffect(() => {
		if (!scanning) {
			setSightings(NONE);
			return undefined;
		}
		const stopScan = beaconScanner.scanEventBeacons(frame =>
			setSightings(current => recordSighting(current, frame.minor, frame, Date.now()))
		);
		const pruning = setInterval(
			() => setSightings(current => pruneSightings(current, Date.now(), BEACON_TIMEOUT_MS)),
			BEACON_PRUNE_MS
		);
		return () => {
			clearInterval(pruning);
			stopScan();
		};
	}, [scanning]);

	const requestPermission = useCallback(() => {
		void beaconScanner.requestScanPermission().then(setPermitted);
	}, []);

	let status: BeaconScanStatus = 'checking';
	if (permitted === false) status = 'needs-permission';
	else if (bluetooth === 'off' || bluetooth === 'unsupported') status = bluetooth;
	else if (scanning) status = 'scanning';

	return { status, sightings, requestPermission };
}
