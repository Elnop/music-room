import { ApiError, apiRequest } from '@/services/api';
import { resetBackendUrl, setBackendUrl } from '@/services/backendUrl';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

const fetchMock = jest.fn();

function jsonResponse(status: number, body: object): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		statusText: '',
		json: () => Promise.resolve(body),
		text: () => Promise.resolve(JSON.stringify(body)),
	} as unknown as Response;
}

beforeEach(async () => {
	jest.spyOn(console, 'log').mockImplementation(() => undefined);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	fetchMock.mockReset();
	fetchMock.mockResolvedValue(jsonResponse(200, { success: true, data: { ok: true } }));
	await resetBackendUrl();
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('apiRequest backend address', () => {
	it('sends the next request to the new address with the client headers', async () => {
		await setBackendUrl('http://192.168.1.20:3000/');

		await expect(apiRequest('/api/playlists')).resolves.toEqual({ ok: true });

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe('http://192.168.1.20:3000/api/playlists');
		expect(init.headers).toMatchObject({
			'X-Platform': expect.any(String),
			'X-Device-Model': expect.any(String),
			'X-App-Version': '1.2.3',
		});
	});

	it('passes the request options through (signal)', async () => {
		const controller = new AbortController();

		await apiRequest('/api/soundcloud/stream?url=x', { signal: controller.signal });

		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(init.signal).toBe(controller.signal);
	});

	it('exposes the HTTP status on errors', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(404, {
				success: false,
				error: { message: 'Track stream not available', code: 'STREAM_NOT_FOUND' },
			})
		);

		const error = await apiRequest('/api/soundcloud/stream?url=x').catch((e: unknown) => e);

		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({ status: 404, code: 'STREAM_NOT_FOUND' });
	});
});
