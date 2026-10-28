import type { NavigationContainerRef } from '@react-navigation/native';
import { Platform } from 'react-native';
import type { AppTabsParamList } from './AppNavigator';
import {
	clearPendingLink,
	createLinking,
	openPendingLink,
	stateFromLinkPath,
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
	it('builds https links to the web app, which messaging apps make clickable', () => {
		expect(playlistLink(ID)).toBe(`https://elnop.github.io/music-room/playlist/${ID}`);
		expect(userLink(ID)).toBe(`https://elnop.github.io/music-room/user/${ID}`);
	});
});

describe('stateFromLinkPath outside a browser', () => {
	it('opens the playlist detail above the playlists list', () => {
		const state = stateFromLinkPath(`playlist/${ID}`);
		expect(state?.routes[0]).toMatchObject({
			name: 'PlaylistsTab',
			state: {
				routes: [{ name: 'Playlists' }, { name: 'PlaylistDetail', params: { id: ID } }],
			},
		});
	});

	it('opens a user profile in the friends tab', () => {
		const state = stateFromLinkPath(`user/${ID}`);
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
		'login',
		'profile/settings',
		`playlist/${ID}/edit`,
	])('ignores %j', path => {
		expect(stateFromLinkPath(path)).toBeUndefined();
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

	it.each([
		['/settings', 'ProfileTab'],
		[`/event/${ID}`, 'HomeTab'],
		['/friends', 'FriendsTab'],
	])('opens the %s screen when signed in', (path, tab) => {
		const linking = createLinking(() => true);
		expect(linking.getStateFromPath!(path, linking.config as Options)?.routes[0].name).toBe(tab);
	});

	it.each(['/login', '/welcome', '/nowhere', `/playlist/${ID}/extra`])(
		'opens the home for %s when signed in',
		path => {
			const linking = createLinking(() => true);
			expect(linking.getStateFromPath!(path, linking.config as Options)).toBeUndefined();
			expect(takePendingLink()).toBeNull();
		}
	);

	it('opens /privacy in both sessions', () => {
		const signedOut = createLinking(() => false);
		expect(
			signedOut.getStateFromPath!('/privacy', signedOut.config as Options)?.routes.map(r => r.name)
		).toEqual(['Welcome', 'PrivacyPolicy']);
		const signedIn = createLinking(() => true);
		expect(signedIn.getStateFromPath!('/privacy', signedIn.config as Options)?.routes[0].name).toBe(
			'ProfileTab'
		);
		expect(takePendingLink()).toBeNull();
	});

	it('opens the welcome screen at the root when signed out', () => {
		const linking = createLinking(() => false);
		const state = linking.getStateFromPath!('/', linking.config as Options);
		expect(state?.routes.map(route => route.name)).toEqual(['Welcome']);
		expect(linking.getPathFromState!({ routes: [{ name: 'Welcome' }] }, linking.config)).toBe('/');
	});

	it('opens a signed-out screen when signed out', () => {
		const linking = createLinking(() => false);
		const state = linking.getStateFromPath!('/register', linking.config as Options);
		expect(state?.routes.map(route => route.name)).toEqual(['Welcome', 'Register']);
	});

	it('keeps an app screen opened signed out, but not the home', () => {
		const linking = createLinking(() => false);
		expect(
			linking.getStateFromPath!('/profile/devices', linking.config as Options)
		).toBeUndefined();
		expect(takePendingLink()).toBe('/profile/devices');
		linking.getStateFromPath!('/', linking.config as Options);
		expect(takePendingLink()).toBeNull();
	});

	it('writes the share path in the address bar', () => {
		const linking = createLinking(() => true);
		const state = stateFromLinkPath(`playlist/${ID}`)!;
		expect(linking.getPathFromState!(state, linking.config)).toBe(`/playlist/${ID}`);
	});

	describe('under a base path', () => {
		const originalBase = process.env.EXPO_BASE_URL;
		beforeEach(() => {
			process.env.EXPO_BASE_URL = '/music-room';
		});
		afterEach(() => {
			if (originalBase === undefined) delete process.env.EXPO_BASE_URL;
			else process.env.EXPO_BASE_URL = originalBase;
		});

		it('adds the base path to the origin prefix', () => {
			expect(createLinking(() => true).prefixes).toEqual([
				'zumik://',
				'http://localhost:8081/music-room',
			]);
		});

		it.each(['playlist', 'user'])('opens a direct /music-room/%s/<id> address', kind => {
			const linking = createLinking(() => true);
			const state = linking.getStateFromPath!(
				`/music-room/${kind}/${ID}`,
				linking.config as Options
			);
			expect(state?.routes[0].name).toBe(kind === 'playlist' ? 'PlaylistsTab' : 'FriendsTab');
		});

		it('keeps the app path of a link received signed out', () => {
			const linking = createLinking(() => false);
			linking.getStateFromPath!(`/music-room/playlist/${ID}`, linking.config as Options);
			expect(takePendingLink()).toBe(`/playlist/${ID}`);
		});

		it('writes the address under the base path', () => {
			const linking = createLinking(() => true);
			const state = stateFromLinkPath(`user/${ID}`)!;
			expect(linking.getPathFromState!(state, linking.config)).toBe(`/music-room/user/${ID}`);
			expect(linking.getPathFromState!({ routes: [{ name: 'Login' }] }, linking.config)).toBe(
				'/music-room/login'
			);
			expect(linking.getPathFromState!({ routes: [{ name: 'Welcome' }] }, linking.config)).toBe(
				'/music-room/'
			);
		});
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
						state: expect.objectContaining({
							routes: [{ name: 'Playlists' }, { name: 'PlaylistDetail', params: { id: ID } }],
						}),
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
