import React from 'react';
import { useDevicePicker } from '@/features/playback/features/control-delegation/features/device-picker/useDevicePicker';
import { DevicePickerSheetView } from '@/features/playback/features/control-delegation/features/device-picker/components/presenters/DevicePickerSheetView';

type DevicePickerSheetProps = {
	visible: boolean;
	onClose: () => void;
};

export function DevicePickerSheetContainer({ visible, onClose }: DevicePickerSheetProps) {
	const { theme, styles, loaded, loading, loadError, pendingKey, retry, isActive, handlePick } =
		useDevicePicker(visible, onClose);

	return (
		<DevicePickerSheetView
			visible={visible}
			onClose={onClose}
			theme={theme}
			styles={styles}
			loaded={loaded}
			loading={loading}
			loadError={loadError}
			pendingKey={pendingKey}
			retry={retry}
			isActive={isActive}
			onPick={handlePick}
		/>
	);
}
