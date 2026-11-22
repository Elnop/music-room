import { useMemo } from 'react';
import { useConnectState } from '@/features/playback/shared/player/hooks/useConnectState';
import { useDeviceList } from '@/features/playback/features/control-delegation/features/device-picker/hooks/useDeviceList';
import { usePickTransfer } from '@/features/playback/features/control-delegation/features/device-picker/hooks/usePickTransfer';
import { pickerSections } from '@/features/playback/features/control-delegation/features/device-picker/lib/pickerSections';
import type { DevicePicker } from '@/features/playback/features/control-delegation/features/device-picker/devicePickerTypes';

export function useDevicePicker(visible: boolean, onClose: () => void): DevicePicker {
	const list = useDeviceList(visible);
	const target = useConnectState((state) => state.target);
	const { pendingKey, onPick } = usePickTransfer(onClose);
	const sections = useMemo(
		() => list.loaded && pickerSections(list.loaded, { target, pendingKey }),
		[list.loaded, target, pendingKey],
	);

	return {
		status: { loading: list.loading, loadError: list.loadError },
		sections,
		onRetry: list.retry,
		onPick,
	};
}
