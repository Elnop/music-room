import {
	DEFAULT_BACKEND_URL,
	INVALID_BACKEND_URL_MESSAGE,
} from '@/shared/backend/configs/backendUrlConfig';
import { reportBackendError } from '@/shared/backend/lib/backendErrors';
import { notifyBackendUrlChange } from '@/shared/backend/lib/backendUrlListeners';
import { normalizeBackendUrl } from '@/shared/backend/lib/normalizeBackendUrl';
import { backendUrlStorage } from '@/shared/backend/lib/backendUrlStorage';

let currentUrl = DEFAULT_BACKEND_URL;

function update(url: string): void {
	if (url === currentUrl) return;
	currentUrl = url;
	notifyBackendUrlChange(url);
}

export function getBackendUrl(): string {
	return currentUrl;
}

export async function loadBackendUrl(): Promise<string> {
	try {
		const stored = await backendUrlStorage.load();
		const url = stored ? normalizeBackendUrl(stored) : null;
		update(url ?? DEFAULT_BACKEND_URL);
	} catch (error) {
		reportBackendError(
			'warn',
			'[BackendUrl] Could not read the stored address, using the default:',
			error,
		);
		update(DEFAULT_BACKEND_URL);
	}
	return currentUrl;
}

export async function setBackendUrl(input: string): Promise<{ url: string } | { error: string }> {
	const url = normalizeBackendUrl(input);
	if (!url) return { error: INVALID_BACKEND_URL_MESSAGE };

	try {
		await backendUrlStorage.save(url);
	} catch (error) {
		reportBackendError('error', '[BackendUrl] Could not persist the address:', error);
	}
	update(url);
	return { url };
}

export async function resetBackendUrl(): Promise<string> {
	try {
		await backendUrlStorage.clear();
	} catch (error) {
		reportBackendError('error', '[BackendUrl] Could not clear the stored address:', error);
	}
	update(DEFAULT_BACKEND_URL);
	return currentUrl;
}
