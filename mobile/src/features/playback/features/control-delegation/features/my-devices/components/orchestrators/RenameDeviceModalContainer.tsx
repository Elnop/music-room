import React from 'react';
import { useRenameDeviceForm } from '@/features/playback/features/control-delegation/features/my-devices/hooks/useRenameDeviceForm';
import { RenameDeviceModalView } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/RenameDeviceModalView';

interface RenameDeviceModalProps {
	/** Null hides the modal. */
	deviceName: string | null;
	saving: boolean;
	onClose: () => void;
	/** Null goes back to the system name. */
	onSubmit: (name: string | null) => void;
}

export function RenameDeviceModalContainer({
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
