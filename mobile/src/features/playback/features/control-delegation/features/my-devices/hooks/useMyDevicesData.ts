import { useCallback, useEffect, useState } from 'react';
import {
	loadMyDevices,
	refreshMyDevices,
} from '@/features/playback/features/control-delegation/features/my-devices/lib/loadMyDevices';
import type {
	MyDevicesState,
	PairUpdate,
} from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

const INITIAL_STATE: MyDevicesState = {
	isLoading: true,
	loadFailed: false,
	isRefreshing: false,
	data: {
		devices: [],
		friends: [],
		allDevicesFriendIds: new Set(),
		currentDeviceId: null,
		licensed: new Set(),
	},
};

export function useMyDevicesData() {
	const [screen, setScreen] = useState(INITIAL_STATE);

	const load = useCallback((isRefresh: boolean) => loadMyDevices(setScreen, isRefresh), []);

	useEffect(() => {
		let isMounted = true;
		void Promise.resolve().then(async () => {
			await load(false);
			if (isMounted) setScreen(current => ({ ...current, isLoading: false }));
		});
		return () => {
			isMounted = false;
		};
	}, [load]);

	const onRefresh = useCallback(() => refreshMyDevices(setScreen), []);

	const updateLicensed = useCallback((update: PairUpdate) => {
		setScreen(current => ({
			...current,
			data: { ...current.data, licensed: update(current.data.licensed) },
		}));
	}, []);

	return { screen, load, onRefresh, updateLicensed };
}
