import { friendsApi } from './friendsApi';
import { profileApi } from './profileApi';
import { privacyApi } from './privacyApi';
import { musicControlApi } from './musicControlApi';
import { resetBackendUrl } from '@/shared/services/backendUrl';
import { registerAuthSession } from '@/shared/services/api';

// Every API module goes through apiRequest, so the backend gets the client
// headers it logs (subject IV.6), a token, and the refresh on 401 (#174).

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('./deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/store/authStore', () => ({
	useAuthStore: { getState: () => ({ accessToken: 'store-token' }) },
}));

const fetchMock = jest.fn();

function jsonResponse(body: object, status = 200): Response {
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
	await resetBackendUrl();
});

afterEach(() => {
	jest.restoreAllMocks();
});

const CLIENT_HEADERS = {
	'X-Platform': expect.any(String),
	'X-Device-Model': expect.any(String),
	'X-App-Version': '1.2.3',
};

it.each([
	['friendsApi', () => friendsApi.getFriends('caller-token'), [], 'caller-token'],
	['profileApi', () => profileApi.getOwnProfile('caller-token'), { id: 'u1' }, 'caller-token'],
	[
		'privacyApi',
		() => privacyApi.getPrivacySettings('caller-token'),
		{ email_visibility: 'private' },
		'caller-token',
	],
	[
		'musicControlApi',
		() => musicControlApi.getMyPermissions(),
		{ allowedUserIds: [] },
		'store-token',
	],
])('%s sends the client headers and the token', async (_name, call, data, token) => {
	fetchMock.mockResolvedValue(jsonResponse({ success: true, data }));

	await call();

	const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
	expect(init.headers).toMatchObject({
		...CLIENT_HEADERS,
		Authorization: `Bearer ${token}`,
	});
});

describe('with a signed-in session', () => {
	let sessionToken = 'session-token';
	const refreshAccessToken = jest.fn(async () => {
		sessionToken = 'refreshed-token';
		return true;
	});

	beforeEach(() => {
		sessionToken = 'session-token';
		refreshAccessToken.mockClear();
		registerAuthSession({
			getAccessToken: () => sessionToken,
			isTokenExpiringSoon: () => false,
			refreshAccessToken,
		});
	});

	it('sends the session token, refreshes it on a 401 and retries', async () => {
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse({ success: false, error: { code: 'INVALID_TOKEN' } }, 401)
			)
			.mockResolvedValueOnce(jsonResponse({ success: true, data: [] }));

		await expect(friendsApi.getFriends('stale-caller-token')).resolves.toEqual([]);

		expect(refreshAccessToken).toHaveBeenCalledTimes(1);
		const [[, first], [, retry]] = fetchMock.mock.calls as [string, RequestInit][];
		expect(first.headers).toMatchObject({
			...CLIENT_HEADERS,
			Authorization: 'Bearer session-token',
		});
		expect(retry.headers).toMatchObject({
			...CLIENT_HEADERS,
			Authorization: 'Bearer refreshed-token',
		});
	});
});
