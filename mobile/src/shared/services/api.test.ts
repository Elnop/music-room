import { ApiError, apiRequest } from './api';
import { resetBackendUrl, setBackendUrl } from './backendUrl';

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

	it('reads the details, why and fix of the backend error format', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(429, {
				success: false,
				error: {
					message: 'Too many requests. Please try again later.',
					code: 'RATE_LIMIT_EXCEEDED',
					details: { retryAfter: '2026-01-01T00:00:00.000Z' },
					why: 'Rate limit reached',
					fix: 'Wait for retryAfter',
				},
				meta: { timestamp: '2026-01-01T00:00:00.000Z' },
			})
		);

		const error = await apiRequest('/api/auth/login').catch((e: unknown) => e);

		expect(error).toMatchObject({
			message: 'Too many requests. Please try again later.',
			code: 'RATE_LIMIT_EXCEEDED',
			status: 429,
			details: { retryAfter: '2026-01-01T00:00:00.000Z' },
			why: 'Rate limit reached',
			fix: 'Wait for retryAfter',
		});
	});

	it('keeps the HTTP status when a 2xx body reports a failure', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(200, { success: false, error: { message: 'Nope', code: 'SOME_CODE' } })
		);

		const error = await apiRequest('/api/playlists').catch((e: unknown) => e);

		expect(error).toBeInstanceOf(ApiError);
		expect(error).toMatchObject({ status: 200, code: 'SOME_CODE', message: 'Nope' });
	});
});

describe('apiRequest body type (#351)', () => {
	it('sends JSON with a JSON Content-Type', async () => {
		await apiRequest('/api/profile', { method: 'PATCH', body: JSON.stringify({ bio: 'x' }) });

		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
	});

	it('lets fetch set the multipart Content-Type of a FormData body, keeping the client headers', async () => {
		const form = new FormData();
		form.append('avatar', 'x');

		await apiRequest('/api/profile/avatar', {
			method: 'PUT',
			body: form,
			headers: { Authorization: 'Bearer token' },
		});

		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		const headers = init.headers as Record<string, string>;
		expect(headers['Content-Type']).toBeUndefined();
		expect(init.body).toBe(form);
		expect(headers).toMatchObject({
			Authorization: 'Bearer token',
			'X-Platform': expect.any(String),
			'X-App-Version': '1.2.3',
		});
	});
});
