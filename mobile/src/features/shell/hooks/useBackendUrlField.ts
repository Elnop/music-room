import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { showSuccess } from '@/shared/theme/lib/toast';
import { getBackendUrl, resetBackendUrl, setBackendUrl } from '@/shared/backend/lib/backendUrl';
import { onBackendUrlChange } from '@/shared/backend/lib/backendUrlListeners';
import type { BackendUrlFieldState } from '@/features/shell/types/backendUrlFieldTypes';

type SetField = Dispatch<SetStateAction<BackendUrlFieldState>>;

function initialField(): BackendUrlFieldState {
	const url = getBackendUrl();
	return { currentUrl: url, draft: url, error: undefined, isSaving: false };
}

function withUrl(url: string) {
	return (field: BackendUrlFieldState): BackendUrlFieldState => ({
		...field,
		currentUrl: url,
		draft: url,
		error: undefined,
		isSaving: false,
	});
}

async function saveUrl(draft: string, setField: SetField) {
	setField(field => ({ ...field, isSaving: true }));
	const result = await setBackendUrl(draft);
	if ('error' in result) {
		setField(field => ({ ...field, isSaving: false, error: result.error }));
		return;
	}
	setField(withUrl(result.url));
	showSuccess(`Adresse du serveur : ${result.url}`);
}

async function resetUrl(setField: SetField) {
	setField(field => ({ ...field, isSaving: true }));
	const url = await resetBackendUrl();
	setField(withUrl(url));
	showSuccess('Adresse du serveur par défaut rétablie');
}

export function useBackendUrlField() {
	const [field, setField] = useState(initialField);

	useEffect(
		() =>
			onBackendUrlChange(url => setField(current => ({ ...current, currentUrl: url, draft: url }))),
		[]
	);

	return {
		field,
		changeDraft: (draft: string) => setField(current => ({ ...current, draft, error: undefined })),
		save: () => saveUrl(field.draft, setField),
		reset: () => resetUrl(setField),
	};
}
