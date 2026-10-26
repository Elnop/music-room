import type { NavigationContainerRef } from '@react-navigation/native';
import { Platform } from 'react-native';
import type { AppTabsParamList } from './AppNavigator';
import {
	clearPendingLink,
	createLinking,
	openPendingLink,
	sharePathFromState,
	stateFromSharePath,
	takePendingLink,
} from './linking';
import { playlistLink, userLink } from '@/shared/utils/shareLinks';

const ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

type Options = Parameters<NonNullable<ReturnType<typeof createLinking>['getStateFromPath']>>[1];

const fakeRef = (ready = true) => {
	const ref = {
		isReady: jest.fn(() => ready),
		dispatch: jest.fn(),
		resetRoot: jest.fn(),
	};
	return ref as typeof ref & NavigationContainerRef<AppTabsParamList>;
};

beforeEach(() => clearPendingLink());

describe('share link builders', () => {
	it('builds zumik:// links', () => {
		expect(playlistLink(ID)).toBe(`zumik://playlist/${ID}`);
		expect(userLink(ID)).toBe(`zumik://user/${ID}`);
	});
});

describe('stateFromSharePath', () => {
	it('opens the playlist detail above the playlists list', () => {
		const state = stateFromSharePath(`playlist/${ID}`);
		expect(state?.routes[0]).toMatchObject({
			name: 'PlaylistsTab',
			state: {
				routes: [{ name: 'Playlists' }, { name: 'PlaylistDetail', params: { id: ID } }],
			},
		});
	});

	it('opens a user profile in the friends tab', () => {
		const state = stateFromSharePath(`user/${ID}`);
		expect(state?.routes[0]).toMatchObject({
			name: 'FriendsTab',
			state: {
				routes: [{ name: 'Friends' }, { name: 'UserProfile', params: { userId: ID } }],
			},
		});
	});

	it.each([
		'playlist/abc',
		`playlist/${ID}/extra`,
		`track/${ID}`,
		'auth/callback?code=x',
		'',
		'user/',
	])('ignores %j', path => {
		expect(stateFromSharePath(path)).toBeUndefined();
	});
});

describe('createLinking', () => {
	it('declares the zumik:// prefix', () => {
		expect(createLinking(() => true).prefixes).toEqual(['zumik://']);
	});

	it('applies a link when signed in', () => {
		const linking = createLinking(() => true);
		const state = linking.getStateFromPath!(`playlist/${ID}`, linking.config as Options);
		expect(state?.routes[0].name).toBe('PlaylistsTab');
		expect(takePendingLink()).toBeNull();
	});

	it('keeps a link received while signed out', () => {
		const linking = createLinking(() => false);
		expect(linking.getStateFromPath!(`user/${ID}`, linking.config as Options)).toBeUndefined();
		expect(takePendingLink()).toBe(`user/${ID}`);
		expect(takePendingLink()).toBeNull();
	});

	it('does not keep a malformed link', () => {
		const linking = createLinking(() => false);
		linking.getStateFromPath!('playlist/abc', linking.config as Options);
		expect(takePendingLink()).toBeNull();
	});
});

describe('createLinking in a browser', () => {
	const originalOS = Platform.OS;
	const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
	beforeEach(() => {
		Platform.OS = 'web';
		Object.defineProperty(globalThis, 'location', {
			value: { origin: 'http://localhost:8081' },
			configurable: true,
		});
	});
	afterEach(() => {
		Platform.OS = originalOS;
		if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation);
		else Reflect.deleteProperty(globalThis, 'location');
	});

	it('adds the page origin to the zumik:// prefix', () => {
		expect(createLinking(() => true).prefixes).toEqual(['zumik://', 'http://localhost:8081']);
	});

	it('opens a reloaded /playlist/<id> address', () => {
		const linking = createLinking(() => true);
		const state = linking.getStateFromPath!(`/playlist/${ID}`, linking.config as Options);
		expect(state?.routes[0].name).toBe('PlaylistsTab');
	});

	it('writes the share path in the address bar', () => {
		const linking = createLinking(() => true);
		expect(linking.getPathFromState).toBe(sharePathFromState);
	});
});

describe('sharePathFromState', () => {
	const tab = (name: string, routes: { name: string; params?: object }[]) => ({
		index: 0,
		routes: [{ name, state: { index: routes.length - 1, routes } }],
	});

	it('is the playlist share path from any tab', () => {
		const state = tab('HomeTab', [
			{ name: 'Home' },
			{ name: 'PlaylistDetail', params: { id: ID } },
		]);
		expect(sharePathFromState(state)).toBe(`/playlist/${ID}`);
	});

	it('is the profile share path', () => {
		const state = tab('FriendsTab', [
			{ name: 'Friends' },
			{ name: 'UserProfile', params: { userId: ID } },
		]);
		expect(sharePathFromState(state)).toBe(`/user/${ID}`);
	});

	it('is the root for any other screen', () => {
		expect(sharePathFromState(tab('ProfileTab', [{ name: 'Profile' }]))).toBe('/');
		expect(sharePathFromState({ routes: [{ name: 'Login' }] })).toBe('/');
	});
});

describe('openPendingLink', () => {
	const keepLink = (path: string) => {
		const linking = createLinking(() => false);
		linking.getStateFromPath!(path, linking.config as Options);
	};

	it('navigates to the pending link once, then forgets it', () => {
		keepLink(`playlist/${ID}`);
		const ref = fakeRef();

		expect(openPendingLink(ref)).toBe(true);
		expect(ref.dispatch).toHaveBeenCalledWith(
			expect.objectContaining({
				type: 'NAVIGATE',
				payload: expect.objectContaining({
					name: 'PlaylistsTab',
					params: expect.objectContaining({
						screen: 'PlaylistDetail',
						params: { id: ID },
					}),
				}),
			})
		);
		expect(openPendingLink(ref)).toBe(false);
		expect(ref.dispatch).toHaveBeenCalledTimes(1);
	});

	it('does nothing without a pending link', () => {
		const ref = fakeRef();
		expect(openPendingLink(ref)).toBe(false);
		expect(ref.dispatch).not.toHaveBeenCalled();
	});

	it('keeps the link while the navigator is not ready', () => {
		keepLink(`user/${ID}`);
		expect(openPendingLink(fakeRef(false))).toBe(false);
		expect(takePendingLink()).toBe(`user/${ID}`);
	});
});
