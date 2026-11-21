import React from 'react';
import { useBackendUrlField } from '@/features/shell/hooks/useBackendUrlField';
import { BackendUrlField } from '@/features/shell/components/presenters/BackendUrlField';

export function BackendUrlFieldContainer() {
	const { field, changeDraft, save, reset } = useBackendUrlField();
	return (
		<BackendUrlField field={field} onChangeDraft={changeDraft} onSave={save} onReset={reset} />
	);
}
