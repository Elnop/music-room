import { useCallback, useEffect, useRef, useState } from 'react';
import { loadDevices } from '@/features/playback/features/control-delegation/features/device-picker/lib/loadDevices';
import type {
	DeviceList,
	DeviceListState,
} from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';

type ShownList = DeviceListState & { visible: boolean };

function emptyList(visible: boolean): ShownList {
	return { loaded: null, loading: visible, loadError: false, visible };
}

export function useDeviceList(visible: boolean): DeviceList {
	const [list, setList] = useState(() => emptyList(visible));
	const generation = useRef(0);

	if (list.visible !== visible) {
		setList(visible ? emptyList(true) : { ...list, visible });
	}

	useEffect(() => {
		if (!visible) return;
		loadDevices(generation, setList);
		return () => {
			generation.current += 1;
		};
	}, [visible]);

	const retry = useCallback(() => {
		setList((current) => ({ ...current, loading: true, loadError: false }));
		loadDevices(generation, setList);
	}, []);

	return { loaded: list.loaded, loading: list.loading, loadError: list.loadError, retry };
}
