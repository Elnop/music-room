import type { Dispatch, SetStateAction } from 'react';
import { showError } from '@/shared/theme/lib/toast';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { fetchMyDevices } from '@/features/playback/features/control-delegation/features/my-devices/lib/fetchMyDevices';
import { LOAD_ERROR } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesConfig';
import type { MyDevicesState } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

export async function loadMyDevices(
	setScreen: Dispatch<SetStateAction<MyDevicesState>>,
	isRefresh: boolean
): Promise<void> {
	try {
		const data = await fetchMyDevices();
		setScreen(screen => ({ ...screen, data, loadFailed: false }));
	} catch (error) {
		if (!isRefresh) setScreen(screen => ({ ...screen, loadFailed: true }));
		showError(apiErrorMessage(error, LOAD_ERROR));
	}
}

export async function refreshMyDevices(
	setScreen: Dispatch<SetStateAction<MyDevicesState>>
): Promise<void> {
	setScreen(screen => ({ ...screen, isRefreshing: true }));
	await loadMyDevices(setScreen, true);
	setScreen(screen => ({ ...screen, isRefreshing: false }));
}
