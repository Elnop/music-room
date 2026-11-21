import React from 'react';
import { useRenameDeviceForm } from '@/features/playback/features/control-delegation/features/my-devices/hooks/useRenameDeviceForm';
import { RenameDeviceModalView } from '@/features/playback/features/control-delegation/features/my-devices/components/presenters/RenameDeviceModalView';

type RenameDeviceModalProps = {
	deviceName: string | null;
	saving: boolean;
	onClose: () => void;
	onSubmit: (name: string | null) => void;
};

export function RenameDeviceModalContainer({
	deviceName,
	saving,
	onClose,
	onSubmit,
}: RenameDeviceModalProps) {
	const form = useRenameDeviceForm({ deviceName, onSubmit });

	return (
		<RenameDeviceModalView deviceName={deviceName} saving={saving} form={form} onClose={onClose} />
	);
}
