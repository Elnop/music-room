import { Platform } from 'react-native';
import { getAppVersion } from '@/shared/backend/deviceService';
import { getDeviceName, getModelName } from '@/shared/backend/lib/deviceIdentity';
import { getBackendUrl } from '@/shared/backend/lib/backendUrl';
import { API_CONFIG } from '@/shared/backend/configs/apiConfig';

const LOCAL_URI = /^(blob|data):/iu;

function requestHeaders(options: RequestInit, token: string | undefined): Record<string, string> {
	const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
	return {
		...(isFormData ? {} : { 'Content-Type': 'application/json' }),
		'X-Platform': Platform.OS,
		'X-Device-Model': getModelName() || getDeviceName() || 'Unknown Device',
		'X-App-Version': getAppVersion(),
		...(options.headers as Record<string, string>),
		...(token ? { Authorization: `Bearer ${token}` } : {}),
	};
}

export async function sendApiRequest(
	endpoint: string,
	options: RequestInit,
	token?: string,
): Promise<Response> {
	const timeout = new AbortController();
	const timer = setTimeout(() => timeout.abort(), API_CONFIG.TIMEOUT);
	try {
		return await fetch(`${getBackendUrl()}${endpoint}`, {
			...options,
			headers: requestHeaders(options, token),
			signal: options.signal ?? timeout.signal,
		});
	} finally {
		clearTimeout(timer);
	}
}

export async function readLocalBlob(uri: string): Promise<Blob> {
	if (!LOCAL_URI.test(uri)) {
		throw new Error(`readLocalBlob only reads blob: and data: URIs, got "${uri.split(':')[0]}:"`);
	}
	return (await fetch(uri)).blob();
}
