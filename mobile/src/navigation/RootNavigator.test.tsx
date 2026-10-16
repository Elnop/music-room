import React from 'react';
import { Linking } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useAuthStore } from '@/store/authStore';
import { clearPendingLink } from '@/navigation/linking';

const ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

jest.mock('@/lib/supabase', () => ({
	supabase: {
		auth: {
			signOut: jest.fn(),
			setSession: jest.fn(),
			onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }),
		},
	},
}));

jest.mock('@services/oauth', () => ({
	signInWithGoogle: jest.fn(),
	signInWithFacebook: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/services/backendUrl', () => ({
	loadBackendUrl: () => Promise.resolve(),
}));

jest.mock('@/store/socketStore', () => {
	const state = { connect: jest.fn(), disconnect: jest.fn() };
	return { useSocketStore: (select: (s: typeof state) => unknown) => select(state) };
});

jest.mock('@hooks/useMusicControl', () => ({
	useMusicControlEmitter: jest.fn(),
}));

jest.mock('@components/common/LoadingSpinner', () => ({
	LoadingSpinner: () => null,
}));

// The real tab and stack layout, with screens that only print their params.
jest.mock('@/navigation/AppNavigator', () => {
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

jest.mock('@/navigation/AuthNavigator', () => {
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
