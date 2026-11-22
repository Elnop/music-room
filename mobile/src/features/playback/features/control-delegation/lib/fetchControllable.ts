import type { Dispatch, RefObject, SetStateAction } from 'react';
import { musicControlApi } from '@/features/playback/features/control-delegation/shared/delegation/musicControlApi';
import { logger } from '@/shared/logging/logger';
import type { ControllableIds } from '@/features/playback/features/control-delegation/controlDelegationTypes';

export function fetchControllable(
	targetUserId: string,
	generation: RefObject<number>,
	setControllable: Dispatch<SetStateAction<ControllableIds | null>>,
): void {
	generation.current += 1;
	const request = generation.current;
	musicControlApi
		.getControllableDevices(targetUserId)
		.then((res) => {
			if (generation.current !== request) return;
			const ids = res.devices.map((d) => d.deviceId);
			setControllable({ userId: targetUserId, allDevices: res.allDevices, ids });
		})
		.catch((err) => {
			logger.error('[MusicControl] Load controllable devices failed:', err);
			if (generation.current !== request) return;
			setControllable({ userId: targetUserId, allDevices: false, ids: [] });
		});
}
