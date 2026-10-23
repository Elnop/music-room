import React from 'react';
import { useRenameDeviceForm } from '@/features/music-control/myDevices/hooks/useRenameDeviceForm';
import { RenameDeviceModalView } from '@/features/music-control/myDevices/components/presenters/RenameDeviceModalView';

interface RenameDeviceModalProps {
	/** Name shown now; the field starts with it. Null hides the modal. */
	deviceName: string | null;
	/** True while the request runs: the buttons are disabled. */
	saving: boolean;
	onClose: () => void;
	/** The trimmed new name, or null to go back to the system name. */
	onSubmit: (name: string | null) => void;
}

export function RenameDeviceModal({
	deviceName,
	saving,
	onClose,
	onSubmit,
}: RenameDeviceModalProps) {
	const { name, onChangeName, error, handleSave, handleReset } = useRenameDeviceForm({
		deviceName,
		onSubmit,
	});

	return (
		<RenameDeviceModalView
			deviceName={deviceName}
			saving={saving}
			name={name}
			error={error}
			onChangeName={onChangeName}
			onClose={onClose}
			onSave={handleSave}
			onReset={handleReset}
		/>
	);
}
