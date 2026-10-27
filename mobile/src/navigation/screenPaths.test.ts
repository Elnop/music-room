import { matchScreenPath, pathFromState, stateFromMatch } from './screenPaths';

const ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

const stateOf = (path: string) => {
	const match = matchScreenPath(path);
	if (!match) throw new Error(`no screen for ${path}`);
	return stateFromMatch(match);
};

interface Node {
	name: string;
	params?: object;
	state?: { routes: readonly Node[] };
}

const outline = (state: { routes: readonly Node[] }): unknown[] =>
	state.routes.map(route =>
		route.state ? [route.name, outline(route.state)] : [route.name, route.params ?? null]
	);

describe('screen paths', () => {
	it.each([
		['/welcome', [['Welcome', null]]],
		[
			'/login',
			[
				['Welcome', null],
				['Login', null],
			],
		],
		[
			'/register',
			[
				['Welcome', null],
				['Register', null],
			],
		],
		[
			'/forgot-password',
			[
				['Welcome', null],
				['Login', null],
				['ForgotPassword', null],
			],
		],
		['/', [['HomeTab', [['Home', null]]]]],
		['/playlists', [['PlaylistsTab', [['Playlists', null]]]]],
		[
			'/playlists/new',
			[
				[
					'PlaylistsTab',
					[
						['Playlists', null],
						['CreatePlaylist', null],
					],
				],
			],
		],
		[
			`/playlist/${ID}`,
			[
				[
					'PlaylistsTab',
					[
						['Playlists', null],
						['PlaylistDetail', { id: ID }],
					],
				],
			],
		],
		...(['edit', 'sharing', 'add-tracks'] as const).map(suffix => [
			`/playlist/${ID}/${suffix}`,
			[
				[
					'PlaylistsTab',
					[
						['Playlists', null],
						['PlaylistDetail', { id: ID }],
						[
							{ edit: 'CreatePlaylist', sharing: 'PlaylistSharing', 'add-tracks': 'SearchTracks' }[
								suffix
							],
							{ playlistId: ID },
						],
					],
				],
			],
		]),
		[
			'/events/new',
			[
				[
					'HomeTab',
					[
						['Home', null],
						['EventForm', null],
					],
				],
			],
		],
		[
			`/event/${ID}`,
			[
				[
					'HomeTab',
					[
						['Home', null],
						['EventDetail', { id: ID }],
					],
				],
			],
		],
		[
			`/event/${ID}/edit`,
			[
				[
					'HomeTab',
					[
						['Home', null],
						['EventDetail', { id: ID }],
						['EventForm', { eventId: ID }],
					],
				],
			],
		],
		['/search', [['SearchTab', [['Search', null]]]]],
		['/friends', [['FriendsTab', [['Friends', null]]]]],
		[
			`/user/${ID}`,
			[
				[
					'FriendsTab',
					[
						['Friends', null],
						['UserProfile', { userId: ID }],
					],
				],
			],
		],
		['/profile', [['ProfileTab', [['Profile', null]]]]],
		...(
			[
				['/profile/edit', 'EditProfile'],
				['/profile/privacy', 'PrivacySettings'],
				['/profile/linked-accounts', 'LinkedAccounts'],
				['/profile/devices', 'MyDevices'],
				['/profile/music', 'MusicPreferences'],
				['/settings', 'Settings'],
			] as const
		).map(([path, screen]) => [
			path,
			[
				[
					'ProfileTab',
					[
						['Profile', null],
						[screen, null],
					],
				],
			],
		]),
	] as [string, unknown[]][])(
		'%s opens its screen above its parents, and back',
		(path, expected) => {
			const state = stateOf(path);
			expect(outline(state as { routes: Node[] })).toEqual(expected);
			expect(pathFromState(state as { routes: Node[] })).toBe(path);
		}
	);

	it.each([
		['/verify-email', ['Welcome', 'Login']],
		['/reset-password', ['Welcome', 'Login', 'ForgotPassword']],
	])('reloads %s on the screen before it, its email being out of the address', (path, names) => {
		const state = stateOf(path);
		expect(state.routes.map(route => route.name)).toEqual(names);
		expect(
			pathFromState({
				routes: [
					{
						name: path === '/verify-email' ? 'EmailVerification' : 'ResetPassword',
						params: { email: 'a@b.c' },
					},
				],
			})
		).toBe(path);
	});

	it('ignores the query, a trailing slash and the case of an identifier', () => {
		expect(matchScreenPath(`/PLAYLIST/${ID.toUpperCase()}/?from=share`)?.entry.screen).toBe(
			'PlaylistDetail'
		);
	});

	it.each(['/nowhere', '/playlist/abc', `/playlist/${ID}/extra`, '/profile/unknown'])(
		'matches no screen for %s',
		path => {
			expect(matchScreenPath(path)).toBeUndefined();
		}
	);
});

describe('pathFromState', () => {
	const tab = (name: string, routes: Node[]) => ({
		index: 0,
		routes: [{ name, state: { index: routes.length - 1, routes } }],
	});

	it('gives a screen held by several stacks one path', () => {
		const detail = { name: 'PlaylistDetail', params: { id: ID } };
		expect(pathFromState(tab('HomeTab', [{ name: 'Home' }, detail]))).toBe(`/playlist/${ID}`);
		expect(pathFromState(tab('FriendsTab', [{ name: 'Friends' }, detail]))).toBe(`/playlist/${ID}`);
		expect(
			pathFromState(
				tab('FriendsTab', [
					{ name: 'Friends' },
					{ name: 'SearchTracks', params: { playlistId: ID } },
				])
			)
		).toBe(`/playlist/${ID}/add-tracks`);
	});

	it('tells the creation form from the edit form', () => {
		expect(pathFromState(tab('PlaylistsTab', [{ name: 'CreatePlaylist' }]))).toBe('/playlists/new');
		expect(pathFromState(tab('HomeTab', [{ name: 'EventForm', params: { eventId: ID } }]))).toBe(
			`/event/${ID}/edit`
		);
	});

	it('reads a tab not rendered yet from its first screen or its screen param', () => {
		expect(pathFromState({ index: 1, routes: [{ name: 'HomeTab' }, { name: 'FriendsTab' }] })).toBe(
			'/friends'
		);
		expect(
			pathFromState({
				routes: [{ name: 'ProfileTab', params: { screen: 'Settings', initial: false } }],
			})
		).toBe('/settings');
	});

	it('is the root for a screen without a path', () => {
		expect(pathFromState({ routes: [{ name: 'Unknown' }] })).toBe('/');
		expect(pathFromState({ routes: [] })).toBe('/');
	});
});
