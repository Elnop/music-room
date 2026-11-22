import type { Dispatch, RefObject, SetStateAction } from 'react';
import { musicControlApi } from '@/features/playback/features/control-delegation/shared/delegation/musicControlApi';
import { deviceService } from '@/shared/backend/deviceService';
import { logger } from '@/shared/logging/logger';
import type { DeviceListState } from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';

export function loadDevices<T extends DeviceListState>(
	generation: RefObject<number>,
	setList: Dispatch<SetStateAction<T>>,
): void {
	generation.current += 1;
	const request = generation.current;
	function isCurrent(): boolean {
		return generation.current === request;
	}
	Promise.all([musicControlApi.getDevicePicker(), deviceService.getDeviceInfo()])
		.then(([picker, info]) => {
			if (!isCurrent()) return;
			setList((list) => ({ ...list, loaded: { owners: picker.owners, phoneId: info.deviceId } }));
		})
		.catch((error) => {
			logger.error('[DevicePickerSheetContainer] Loading devices failed:', error);
			if (isCurrent()) setList((list) => ({ ...list, loadError: true }));
		})
		.finally(() => {
			if (isCurrent()) setList((list) => ({ ...list, loading: false }));
		});
}
