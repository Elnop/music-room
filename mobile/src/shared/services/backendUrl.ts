import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/shared/constants/app';
import { logger } from '@/shared/utils/logger';

// Changeable from the app without a rebuild: every HTTP client and the socket read it at call time.

const STORAGE_KEY = 'zumik.backendUrl';

/** Parsed by hand: React Native's URL polyfill does not implement `hostname`, `search` or `hash`. */
const URL_PARTS = /^(https?):\/\/([^/?#@\s]*)\/*$/i;
const AUTHORITY = /^(\[[0-9a-f:.]+\]|[a-z0-9-]+(?:\.[a-z0-9-]+)*)(?::(\d{1,5}))?$/i;

export const DEFAULT_BACKEND_URL = normalize(API_CONFIG.BASE_URL) ?? 'http://localhost:3000';

export const INVALID_BACKEND_URL_MESSAGE =
	'Saisissez une adresse http:// ou https:// complète, par exemple http://192.168.1.20:3000';

type Listener = (url: string) => void;

let currentUrl = DEFAULT_BACKEND_URL;
const listeners = new Set<Listener>();

/** Null unless an http(s) URL with a hostname and an optional port only (no credentials, path, query or fragment). */
export function normalize(input: string): string | null {
	const parts = URL_PARTS.exec(input.trim());
	if (!parts) return null;
	const authority = AUTHORITY.exec(parts[2]);
	if (!authority) return null;
	const port = authority[2];
	if (port !== undefined && (Number(port) < 1 || Number(port) > 65535)) return null;
	return `${parts[1]}://${parts[2]}`;
}

function update(url: string): void {
	if (url === currentUrl) return;
	currentUrl = url;
	listeners.forEach(listener => listener(url));
}

export function getBackendUrl(): string {
	return currentUrl;
}

/** A missing, invalid or unreadable value leaves the build-time default. */
export async function loadBackendUrl(): Promise<string> {
	try {
		const stored = await AsyncStorage.getItem(STORAGE_KEY);
		const url = stored ? normalize(stored) : null;
		update(url ?? DEFAULT_BACKEND_URL);
	} catch (error) {
		logger.warn('[BackendUrl] Could not read the stored address, using the default:', error);
		update(DEFAULT_BACKEND_URL);
	}
	return currentUrl;
}

/** Returns an error message for invalid input, keeping the current address. */
export async function setBackendUrl(input: string): Promise<{ url: string } | { error: string }> {
	const url = normalize(input);
	if (!url) return { error: INVALID_BACKEND_URL_MESSAGE };

	try {
		await AsyncStorage.setItem(STORAGE_KEY, url);
	} catch (error) {
		logger.error('[BackendUrl] Could not persist the address:', error);
	}
	update(url);
	return { url };
}

/** Restores the build-time default and clears the stored address. */
export async function resetBackendUrl(): Promise<string> {
	try {
		await AsyncStorage.removeItem(STORAGE_KEY);
	} catch (error) {
		logger.error('[BackendUrl] Could not clear the stored address:', error);
	}
	update(DEFAULT_BACKEND_URL);
	return currentUrl;
}

export function onBackendUrlChange(listener: Listener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
