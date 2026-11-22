import { useCallback } from 'react';
import { useControllableIds } from '@/features/playback/features/control-delegation/hooks/useControllableIds';
import { useControlErrors } from '@/features/playback/features/control-delegation/hooks/useControlErrors';
import { controllableView } from '@/features/playback/features/control-delegation/lib/controllableView';

export function useControllableDevices(targetUserId: string | null) {
	const { controllable, reload } = useControllableIds(targetUserId);
	const controlError = useControlErrors(targetUserId, reload);
	const view = controllableView(controllable, targetUserId);

	const isControllable = useCallback(
		(deviceId: string) => view.allDevices || view.ids.includes(deviceId),
		[view.allDevices, view.ids],
	);

	return { canControl: view.canControl, isControllable, controlError };
}
