import { useState } from 'react';

const DEVICE_NAME_MAX_LENGTH = 40;

interface UseRenameDeviceFormOptions {
	deviceName: string | null;
	onSubmit: (name: string | null) => void;
}

export function useRenameDeviceForm({ deviceName, onSubmit }: UseRenameDeviceFormOptions) {
	const [name, setName] = useState(deviceName ?? '');
	const [error, setError] = useState<string | undefined>();
	const [openedFor, setOpenedFor] = useState(deviceName);

	if (deviceName !== openedFor) {
		setOpenedFor(deviceName);
		if (deviceName !== null) {
			setName(deviceName);
			setError(undefined);
		}
	}

	const handleChangeName = (text: string) => {
		setName(text);
		setError(undefined);
	};

	const handleSave = () => {
		const trimmed = name.trim();
		if (trimmed.length === 0) {
			setError('Saisissez un nom');
			return;
		}
		if (trimmed.length > DEVICE_NAME_MAX_LENGTH) {
			setError(`${DEVICE_NAME_MAX_LENGTH} caractères au maximum`);
			return;
		}
		onSubmit(trimmed);
	};

	const handleReset = () => {
		setError(undefined);
		onSubmit(null);
	};

	return {
		name,
		onChangeName: handleChangeName,
		error,
		handleSave,
		handleReset,
	};
}
