import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '@/shared/constants/app';
import {
	DEFAULT_BACKEND_URL,
	INVALID_BACKEND_URL_MESSAGE,
	getBackendUrl,
	loadBackendUrl,
	normalize,
	onBackendUrlChange,
	resetBackendUrl,
	setBackendUrl,
} from './backendUrl';
import { logger } from '@/shared/utils/logger';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const STORAGE_KEY = 'zumik.backendUrl';
const storage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

beforeEach(async () => {
	jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	await resetBackendUrl();
	await AsyncStorage.clear();
	jest.clearAllMocks();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('backendUrl first launch', () => {
	it('defaults to the build-time address', async () => {
		expect(DEFAULT_BACKEND_URL).toBe(API_CONFIG.BASE_URL.replace(/\/+$/, ''));
		await expect(loadBackendUrl()).resolves.toBe(DEFAULT_BACKEND_URL);
		expect(getBackendUrl()).toBe(DEFAULT_BACKEND_URL);
	});
});

describe('backendUrl save', () => {
	it('trims the trailing slash, persists and applies the address', async () => {
		await expect(setBackendUrl('  http://192.168.1.20:3000/ ')).resolves.toEqual({
			url: 'http://192.168.1.20:3000',
		});

		expect(getBackendUrl()).toBe('http://192.168.1.20:3000');
		await expect(AsyncStorage.getItem(STORAGE_KEY)).resolves.toBe('http://192.168.1.20:3000');
	});

	it('notifies listeners once per change', async () => {
		const listener = jest.fn();
		const unsubscribe = onBackendUrlChange(listener);

		await setBackendUrl('https://zumik.example.com');
		await setBackendUrl('https://zumik.example.com/');
		unsubscribe();
		await setBackendUrl('http://10.0.0.2:3000');

		expect(listener).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledWith('https://zumik.example.com');
	});

	it('still applies the address when storage fails', async () => {
		storage.setItem.mockRejectedValueOnce(new Error('disk full'));

		await expect(setBackendUrl('http://10.0.0.2:3000')).resolves.toEqual({
			url: 'http://10.0.0.2:3000',
		});
		expect(getBackendUrl()).toBe('http://10.0.0.2:3000');
	});
});

describe('backendUrl relaunch', () => {
	it('starts on the stored address', async () => {
		await AsyncStorage.setItem(STORAGE_KEY, 'http://192.168.1.20:3000');

		await expect(loadBackendUrl()).resolves.toBe('http://192.168.1.20:3000');
		expect(getBackendUrl()).toBe('http://192.168.1.20:3000');
	});

	it('falls back to the default when storage cannot be read', async () => {
		await setBackendUrl('http://192.168.1.20:3000');
		storage.getItem.mockRejectedValueOnce(new Error('storage unavailable'));

		await expect(loadBackendUrl()).resolves.toBe(DEFAULT_BACKEND_URL);
	});

	it('ignores an invalid stored value', async () => {
		await AsyncStorage.setItem(STORAGE_KEY, 'not a url');

		await expect(loadBackendUrl()).resolves.toBe(DEFAULT_BACKEND_URL);
	});
});

describe('backendUrl invalid input', () => {
	it.each([
		'foo',
		'ftp://x',
		'',
		'   ',
		'http://',
		'http:// host',
		'localhost:3000',
		'http://:3000',
		'http://...',
		'http://user:pass@host',
		'http://host?x=1',
		'http://host/#frag',
		'http://host/api',
		'https://host/api//',
		'http://host:0',
		'http://host:70000',
	])('refuses %p and keeps the current address', async input => {
		await setBackendUrl('http://192.168.1.20:3000');
		storage.setItem.mockClear();

		await expect(setBackendUrl(input)).resolves.toEqual({
			error: INVALID_BACKEND_URL_MESSAGE,
		});
		expect(getBackendUrl()).toBe('http://192.168.1.20:3000');
		expect(storage.setItem).not.toHaveBeenCalled();
	});

	it.each([
		['http://localhost:3000', 'http://localhost:3000'],
		['HTTPS://abc.ngrok.app/', 'HTTPS://abc.ngrok.app'],
		['http://192.168.1.20:3000///', 'http://192.168.1.20:3000'],
		['http://[::1]:3000', 'http://[::1]:3000'],
	])('accepts %p', (input, expected) => {
		expect(normalize(input)).toBe(expected);
	});
});

describe('backendUrl reset', () => {
	it('restores the build-time default and clears storage', async () => {
		await setBackendUrl('http://192.168.1.20:3000');

		await expect(resetBackendUrl()).resolves.toBe(DEFAULT_BACKEND_URL);

		expect(getBackendUrl()).toBe(DEFAULT_BACKEND_URL);
		await expect(AsyncStorage.getItem(STORAGE_KEY)).resolves.toBeNull();
	});
});
