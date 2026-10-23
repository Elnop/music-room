import React from 'react';
import { useDevicePicker } from '@/features/queue/devicePicker/hooks/useDevicePicker';
import { DevicePickerSheetView } from '@/features/queue/devicePicker/components/presenters/DevicePickerSheetView';

interface DevicePickerSheetProps {
	visible: boolean;
	onClose: () => void;
}

export function DevicePickerSheet({ visible, onClose }: DevicePickerSheetProps) {
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
