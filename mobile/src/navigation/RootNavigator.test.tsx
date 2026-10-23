import React from 'react';
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen } from '@testing-library/react-native';
import { RootNavigator } from './RootNavigator';
import { useAuthStore } from '@/features/auth/stores/authStore';
import { clearPendingLink } from './linking';
import { logger } from '@/shared/utils/logger';

const ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/shared/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/services/backendUrl', () => ({
	loadBackendUrl: () => Promise.resolve(),
	getBackendUrl: () => 'http://backend.test',
}));

jest.mock('@/shared/stores/socketStore', () => {
	const state = { connect: jest.fn(), disconnect: jest.fn() };
	return { useSocketStore: (select: (s: typeof state) => unknown) => select(state) };
});

jest.mock('@/features/music-control/hooks/useMusicControlEmitter', () => ({
	useMusicControlEmitter: jest.fn(),
}));

jest.mock('@/shared/components/ui/LoadingSpinner', () => ({
	LoadingSpinner: () => null,
}));

// The real tab and stack layout, with screens that only print their params.
jest.mock('./AppNavigator', () => {
	const { Text } = jest.requireActual('react-native');
	const { createNativeStackNavigator } = jest.requireActual('@react-navigation/native-stack');
	const { createBottomTabNavigator } = jest.requireActual('@react-navigation/bottom-tabs');
	const Tab = createBottomTabNavigator();
	const Playlists = createNativeStackNavigator();
	const Friends = createNativeStackNavigator();
	const show =
		(label: string) =>
		({ route }: { route: { params?: Record<string, string> } }) => (
			<Text>{`${label} ${JSON.stringify(route.params ?? {})}`}</Text>
		);
	const PlaylistsNavigator = () => (
		<Playlists.Navigator>
			<Playlists.Screen name="Playlists" component={show('playlists')} />
			<Playlists.Screen name="PlaylistDetail" component={show('playlist-detail')} />
		</Playlists.Navigator>
	);
	const FriendsNavigator = () => (
		<Friends.Navigator>
			<Friends.Screen name="Friends" component={show('friends')} />
			<Friends.Screen name="UserProfile" component={show('user-profile')} />
		</Friends.Navigator>
	);
	return {
		AppNavigator: () => (
			<Tab.Navigator>
				<Tab.Screen name="PlaylistsTab" component={PlaylistsNavigator} />
				<Tab.Screen name="SearchTab" component={show('search')} />
				<Tab.Screen name="FriendsTab" component={FriendsNavigator} />
				<Tab.Screen name="ProfileTab" component={show('profile')} />
			</Tab.Navigator>
		),
	};
});

jest.mock('./AuthNavigator', () => {
	const { Text } = jest.requireActual('react-native');
	return { AuthNavigator: () => <Text>sign-in</Text> };
});

jest.mock('react-native-safe-area-context', () => {
	const actual = jest.requireActual('react-native-safe-area-context');
	const insets = { top: 0, bottom: 0, left: 0, right: 0 };
	return {
		...actual,
		useSafeAreaInsets: () => insets,
		useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
		SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
	};
});

// The store's own actions, before a test replaces them with stubs.
const { loadFromStorage, isTokenExpiringSoon } = useAuthStore.getState();

const signIn = () =>
	act(() => {
		useAuthStore.setState({ isAuthenticated: true });
	});

const renderWithUrl = async (url: string | null, signedIn: boolean) => {
	jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(url as string);
	useAuthStore.setState({
		isAuthenticated: signedIn,
		loadFromStorage: jest.fn(async () => {}),
		isTokenExpiringSoon: () => false,
	});
	render(<RootNavigator />);
	await act(async () => {});
};

beforeEach(() => {
	jest.restoreAllMocks();
	clearPendingLink();
});

describe('RootNavigator share links', () => {
	it('opens a playlist link on start when signed in', async () => {
		await renderWithUrl(`zumik://playlist/${ID}`, true);
		expect(await screen.findByText(`playlist-detail {"id":"${ID}"}`)).toBeTruthy();
	});

	it('opens a link received while signed out once signed in', async () => {
		await renderWithUrl(`zumik://user/${ID}`, false);
		expect(screen.getByText('sign-in')).toBeTruthy();

		signIn();

		expect(await screen.findByText(`user-profile {"userId":"${ID}"}`)).toBeTruthy();
	});

	it('opens a link received while the app is open', async () => {
		let onUrl: ((event: { url: string }) => void) | undefined;
		jest.spyOn(Linking, 'addEventListener').mockImplementation((_type, listener) => {
			onUrl = listener as typeof onUrl;
			return { remove: jest.fn() } as unknown as ReturnType<typeof Linking.addEventListener>;
		});
		await renderWithUrl(null, true);
		expect(await screen.findByText('playlists {}')).toBeTruthy();

		act(() => onUrl?.({ url: `zumik://user/${ID}` }));

		expect(await screen.findByText(`user-profile {"userId":"${ID}"}`)).toBeTruthy();
	});

	it('ignores a malformed link and starts normally', async () => {
		await renderWithUrl('zumik://playlist/abc', true);
		expect(await screen.findByText('playlists {}')).toBeTruthy();
	});
});

describe('RootNavigator session restore', () => {
	const fetchMock = jest.fn();
	const user = {
		id: 'user-a',
		email: 'a@example.com',
		username: 'alice',
		createdAt: '2025-01-01T00:00:00Z',
		updatedAt: '2025-01-01T00:00:00Z',
	};

	function jsonResponse(status: number, body: object): Response {
		return {
			ok: status >= 200 && status < 300,
			status,
			statusText: '',
			json: () => Promise.resolve(body),
			text: () => Promise.resolve(JSON.stringify(body)),
		} as unknown as Response;
	}

	/** A session saved by a previous run, its access token expired a minute ago. */
	async function storeExpiredSession(): Promise<void> {
		await AsyncStorage.multiSet([
			['@zumik/auth_user', JSON.stringify(user)],
			['@zumik/access_token', 'stored-access'],
			['@zumik/refresh_token', 'stored-refresh'],
			['@zumik/is_authenticated', 'true'],
			['@zumik/token_expires_at', String(Date.now() - 60_000)],
		]);
	}

	async function renderColdStart(): Promise<void> {
		jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null as unknown as string);
		useAuthStore.setState({
			user: null,
			accessToken: null,
			refreshToken: null,
			tokenExpiresAt: null,
			isAuthenticated: false,
			isRefreshing: false,
			loadFromStorage,
			isTokenExpiringSoon,
		});
		render(<RootNavigator />);
		await act(async () => {});
	}

	const realFetch = globalThis.fetch;

	afterEach(() => {
		globalThis.fetch = realFetch;
		// Linking.getInitialURL and the logger spies
		jest.restoreAllMocks();
		useAuthStore.setState({
			user: null,
			accessToken: null,
			refreshToken: null,
			tokenExpiresAt: null,
			isAuthenticated: false,
			isRefreshing: false,
			loadFromStorage,
			isTokenExpiringSoon,
		});
	});

	beforeEach(async () => {
		jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
		jest.spyOn(logger, 'error').mockImplementation(() => undefined);
		globalThis.fetch = fetchMock as unknown as typeof fetch;
		fetchMock.mockReset();
		await AsyncStorage.clear();
		await storeExpiredSession();
	});

	it('refreshes an expired stored session through the backend and opens the app', async () => {
		const expiresAt = Math.floor(Date.now() / 1000) + 3600;
		fetchMock.mockResolvedValue(
			jsonResponse(200, {
				success: true,
				data: {
					user,
					session: {
						accessToken: 'new-access',
						refreshToken: 'new-refresh',
						expiresIn: 3600,
						expiresAt,
					},
				},
			})
		);

		await renderColdStart();

		expect(await screen.findByText('playlists {}')).toBeTruthy();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe('http://backend.test/api/auth/refresh');
		expect(JSON.parse(init.body as string)).toEqual({ refreshToken: 'stored-refresh' });
		expect(useAuthStore.getState()).toMatchObject({
			accessToken: 'new-access',
			refreshToken: 'new-refresh',
			tokenExpiresAt: expiresAt * 1000,
			isAuthenticated: true,
		});
		expect(await AsyncStorage.getItem('@zumik/access_token')).toBe('new-access');
	});

	it('lands on sign-in with storage cleared when the backend refuses the refresh', async () => {
		fetchMock.mockResolvedValue(
			jsonResponse(401, {
				success: false,
				error: { message: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' },
			})
		);

		await renderColdStart();

		expect(await screen.findByText('sign-in')).toBeTruthy();
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(fetchMock.mock.calls[0][0]).toBe('http://backend.test/api/auth/refresh');
		expect(useAuthStore.getState()).toMatchObject({
			user: null,
			accessToken: null,
			refreshToken: null,
			isAuthenticated: false,
		});
		expect(await AsyncStorage.getItem('@zumik/access_token')).toBeNull();
		expect(await AsyncStorage.getItem('@zumik/refresh_token')).toBeNull();
		expect(await AsyncStorage.getItem('@zumik/is_authenticated')).toBeNull();
	});
});
