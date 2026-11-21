import React from 'react';
import { useDevicePicker } from '@/features/playback/features/control-delegation/features/device-picker/hooks/useDevicePicker';
import { DevicePickerSheetView } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/DevicePickerSheetView';

type DevicePickerSheetContainerProps = {
	visible: boolean;
	onClose: () => void;
};

export function DevicePickerSheetContainer({ visible, onClose }: DevicePickerSheetContainerProps) {
	const picker = useDevicePicker(visible, onClose);

	return <DevicePickerSheetView visible={visible} onClose={onClose} picker={picker} />;
}
