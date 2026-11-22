import { friendsApi } from '@/features/user/features/friends/shared/follows/friendsApi';
import { profileApi } from '@/features/user/features/profile/shared/profile/lib/profileApi';
import { privacyApi } from '@/features/user/features/profile/shared/profile/lib/privacyApi';
import { musicControlApi } from '@/features/playback/features/control-delegation/shared/delegation/musicControlApi';
import { resetBackendUrl } from '@/shared/backend/lib/backendUrl';
import { createStore } from 'zustand';
import { registerAuthSession } from '@/shared/backend/lib/authSession';
import type { SessionView } from '@/shared/backend/types/sessionTypes';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/backend/deviceService', () => ({
	getAppVersion: () => '1.2.3',
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
			store: {
				...createStore<SessionView>(() => ({
					user: null,
					accessToken: null,
					isAuthenticated: true,
				})),
				getState: () => ({ user: null, accessToken: sessionToken, isAuthenticated: true }),
			},
			isTokenExpiringSoon: () => false,
			refreshAccessToken,
		});
	});

	it.each([
		['friendsApi', () => friendsApi.getFriends(), []],
		['profileApi', () => profileApi.getOwnProfile(), { id: 'u1' }],
		['privacyApi', () => privacyApi.getPrivacySettings(), { email_visibility: 'private' }],
		['musicControlApi', () => musicControlApi.getMyPermissions(), { allowedUserIds: [] }],
	])('%s sends the client headers and the session token', async (_name, call, data) => {
		fetchMock.mockResolvedValue(jsonResponse({ success: true, data }));

		await call();

		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(init.headers).toMatchObject({
			...CLIENT_HEADERS,
			Authorization: 'Bearer session-token',
		});
	});

	it('sends the session token, refreshes it on a 401 and retries', async () => {
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse({ success: false, error: { code: 'INVALID_TOKEN' } }, 401)
			)
			.mockResolvedValueOnce(jsonResponse({ success: true, data: [] }));

		await expect(friendsApi.getFriends()).resolves.toStrictEqual([]);

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
