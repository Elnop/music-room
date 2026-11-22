import { useState } from 'react';
import { deviceNameError } from '@/features/playback/features/control-delegation/features/my-devices/lib/deviceFormatters';
import type { RenameForm } from '@/features/playback/features/control-delegation/features/my-devices/myDevicesTypes';

type UseRenameDeviceFormOptions = {
	deviceName: string | null;
	onSubmit: (name: string | null) => void;
};

type FormState = {
	name: string;
	error?: string;
	openedFor: string | null;
};

function reopenedForm(form: FormState, deviceName: string | null): FormState {
	return deviceName === null
		? { ...form, openedFor: deviceName }
		: { name: deviceName, error: undefined, openedFor: deviceName };
}

export function useRenameDeviceForm({
	deviceName,
	onSubmit,
}: UseRenameDeviceFormOptions): RenameForm {
	const [form, setForm] = useState<FormState>({ name: deviceName ?? '', openedFor: deviceName });

	if (deviceName !== form.openedFor) {
		setForm(reopenedForm(form, deviceName));
	}

	function onSave() {
		const trimmed = form.name.trim();
		const error = deviceNameError(trimmed);
		if (error) setForm((current) => ({ ...current, error }));
		else onSubmit(trimmed);
	}

	return {
		name: form.name,
		error: form.error,
		onChangeName: (text) => setForm((current) => ({ ...current, name: text, error: undefined })),
		onSave,
		onReset: () => {
			setForm((current) => ({ ...current, error: undefined }));
			onSubmit(null);
		},
	};
}
