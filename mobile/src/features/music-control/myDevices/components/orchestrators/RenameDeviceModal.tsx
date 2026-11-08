import React from 'react';
import { useRenameDeviceForm } from '@/features/music-control/myDevices/hooks/useRenameDeviceForm';
import { RenameDeviceModalView } from '@/features/music-control/myDevices/components/presenters/RenameDeviceModalView';

interface RenameDeviceModalProps {
	deviceName: string | null;
	saving: boolean;
	onClose: () => void;
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
