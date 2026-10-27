// One browser path per screen. A screen several stacks hold opens in its canonical tab, above the
// screens leading to it so « back » works. Only identifiers go in a path. A path both sessions open
// (`/`, `/privacy`) has one entry per session, the signed-out one without a tab.

import type { InitialState } from '@react-navigation/native';
import type { AppTabsParamList } from './AppNavigator';

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

type AppTab = keyof AppTabsParamList;

interface StackRoute {
	name: string;
	params?: object;
}

interface ScreenPath {
	screen: string;
	/** `:id` stands for the identifier, read from and written to the `param` of the screen. */
	path: string;
	param?: string;
	/** The tab holding the screen; none for the signed-out screens. */
	tab?: AppTab;
	/** The stack a reload opens, bottom first. */
	routes: (id: string) => StackRoute[];
	/** A `zumik://` link: the only paths Android opens. */
	shared?: true;
}

const PLAYLIST = (id: string): StackRoute[] => [
	{ name: 'Playlists' },
	{ name: 'PlaylistDetail', params: { id } },
];
const EVENT = (id: string): StackRoute[] => [
	{ name: 'Home' },
	{ name: 'EventDetail', params: { id } },
];
const LOGIN: StackRoute[] = [{ name: 'Welcome' }, { name: 'Login' }];
const PROFILE: StackRoute[] = [{ name: 'Profile' }];

const profileScreen = (screen: string, path: string): ScreenPath => ({
	screen,
	path,
	tab: 'ProfileTab',
	routes: () => [...PROFILE, { name: screen }],
});

// The email and the user id of a code screen stay out of the address: a reload opens the screen before it.
const SCREEN_PATHS: readonly ScreenPath[] = [
	{ screen: 'Welcome', path: '', routes: () => [{ name: 'Welcome' }] },
	{ screen: 'Welcome', path: 'welcome', routes: () => [{ name: 'Welcome' }] },
	{
		screen: 'PrivacyPolicy',
		path: 'privacy',
		routes: () => [{ name: 'Welcome' }, { name: 'PrivacyPolicy' }],
	},
	{ screen: 'Login', path: 'login', routes: () => LOGIN },
	{
		screen: 'Register',
		path: 'register',
		routes: () => [{ name: 'Welcome' }, { name: 'Register' }],
	},
	{ screen: 'EmailVerification', path: 'verify-email', routes: () => LOGIN },
	{
		screen: 'ForgotPassword',
		path: 'forgot-password',
		routes: () => [...LOGIN, { name: 'ForgotPassword' }],
	},
	{
		screen: 'ResetPassword',
		path: 'reset-password',
		routes: () => [...LOGIN, { name: 'ForgotPassword' }],
	},
	{ screen: 'Home', path: '', tab: 'HomeTab', routes: () => [{ name: 'Home' }] },
	{
		screen: 'Playlists',
		path: 'playlists',
		tab: 'PlaylistsTab',
		routes: () => [{ name: 'Playlists' }],
	},
	{
		screen: 'CreatePlaylist',
		path: 'playlists/new',
		tab: 'PlaylistsTab',
		routes: () => [{ name: 'Playlists' }, { name: 'CreatePlaylist' }],
	},
	{
		screen: 'PlaylistDetail',
		path: 'playlist/:id',
		param: 'id',
		tab: 'PlaylistsTab',
		routes: PLAYLIST,
		shared: true,
	},
	...(
		[
			['CreatePlaylist', 'edit'],
			['PlaylistSharing', 'sharing'],
			['SearchTracks', 'add-tracks'],
		] as const
	).map(([screen, path]) => ({
		screen,
		path: `playlist/:id/${path}`,
		param: 'playlistId',
		tab: 'PlaylistsTab' as const,
		routes: (id: string) => [...PLAYLIST(id), { name: screen, params: { playlistId: id } }],
	})),
	{
		screen: 'EventForm',
		path: 'events/new',
		tab: 'HomeTab',
		routes: () => [{ name: 'Home' }, { name: 'EventForm' }],
	},
	{ screen: 'EventDetail', path: 'event/:id', param: 'id', tab: 'HomeTab', routes: EVENT },
	{
		screen: 'EventForm',
		path: 'event/:id/edit',
		param: 'eventId',
		tab: 'HomeTab',
		routes: id => [...EVENT(id), { name: 'EventForm', params: { eventId: id } }],
	},
	{ screen: 'Search', path: 'search', tab: 'SearchTab', routes: () => [{ name: 'Search' }] },
	{ screen: 'Friends', path: 'friends', tab: 'FriendsTab', routes: () => [{ name: 'Friends' }] },
	{
		screen: 'UserProfile',
		path: 'user/:id',
		param: 'userId',
		tab: 'FriendsTab',
		routes: id => [{ name: 'Friends' }, { name: 'UserProfile', params: { userId: id } }],
		shared: true,
	},
	{ screen: 'Profile', path: 'profile', tab: 'ProfileTab', routes: () => PROFILE },
	profileScreen('EditProfile', 'profile/edit'),
	profileScreen('PrivacySettings', 'profile/privacy'),
	profileScreen('LinkedAccounts', 'profile/linked-accounts'),
	profileScreen('MyDevices', 'profile/devices'),
	profileScreen('MusicPreferences', 'profile/music'),
	profileScreen('Settings', 'settings'),
	{
		screen: 'PrivacyPolicy',
		path: 'privacy',
		tab: 'ProfileTab',
		routes: () => [...PROFILE, { name: 'Settings' }, { name: 'PrivacyPolicy' }],
	},
];

/** A tab opened before its stack has a state shows its first screen. */
const TAB_SCREENS: Record<AppTab, string> = {
	HomeTab: 'Home',
	PlaylistsTab: 'Playlists',
	SearchTab: 'Search',
	FriendsTab: 'Friends',
	ProfileTab: 'Profile',
};

const MATCHERS = SCREEN_PATHS.map(entry => ({
	entry,
	regex: new RegExp(`^${entry.path.replace(':id', `(${UUID})`)}$`, 'i'),
}));

export interface ScreenPathMatch {
	entry: ScreenPath;
	id: string;
}

/**
 * The screen of an app path; the query and a trailing slash are ignored. Given the session, the entry
 * of that session comes first, the other one otherwise.
 */
export function matchScreenPath(path: string, signedIn?: boolean): ScreenPathMatch | undefined {
	const bare = path.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
	let otherSession: ScreenPathMatch | undefined;
	for (const { entry, regex } of MATCHERS) {
		const found = regex.exec(bare);
		if (!found) continue;
		const match = { entry, id: found[1] ?? '' };
		if (signedIn === undefined || Boolean(entry.tab) === signedIn) return match;
		otherSession ??= match;
	}
	return otherSession;
}

export function stateFromMatch({ entry, id }: ScreenPathMatch): InitialState {
	const routes = entry.routes(id);
	const stack = { index: routes.length - 1, routes };
	return entry.tab ? { routes: [{ name: entry.tab, state: stack }] } : stack;
}

interface RouteNode {
	name: string;
	params?: object;
	state?: StateNode;
}

interface StateNode {
	index?: number;
	routes: readonly RouteNode[];
}

interface NestedParams {
	screen?: string;
	params?: object;
}

/** The focused screen, following a nested state or the `screen` param of a tab not rendered yet. */
function focusedRoute(state: StateNode): RouteNode | undefined {
	let route = state.routes[state.index ?? state.routes.length - 1];
	for (;;) {
		if (route?.state)
			route = route.state.routes[route.state.index ?? route.state.routes.length - 1];
		else if (route && (route.params as NestedParams | undefined)?.screen) {
			const nested = route.params as NestedParams;
			route = { name: nested.screen as string, params: nested.params };
		} else return route;
	}
}

/** The path of the focused screen; the root for a screen that has none. */
export function pathFromState(state: StateNode): string {
	const route = focusedRoute(state);
	if (!route) return '/';
	const name = TAB_SCREENS[route.name as AppTab] ?? route.name;
	const params = (route.params ?? {}) as Record<string, unknown>;
	// A form with an identifier edits it, without one it creates
	const candidates = SCREEN_PATHS.filter(candidate => candidate.screen === name);
	const entry =
		candidates.find(candidate => candidate.param && typeof params[candidate.param] === 'string') ??
		candidates.find(candidate => !candidate.param);
	if (!entry) return '/';
	const id = entry.param ? String(params[entry.param]) : '';
	return `/${entry.path.replace(':id', id)}`;
}
