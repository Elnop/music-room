import type { ScreenPath, StackRoute } from '@/features/shell/types/screenPathTypes';

function PLAYLIST(id: string): StackRoute[] {
	return [{ name: 'Playlists' }, { name: 'PlaylistDetail', params: { id } }];
}
function EVENT(id: string): StackRoute[] {
	return [{ name: 'Home' }, { name: 'EventDetail', params: { id } }];
}
const LOGIN: StackRoute[] = [{ name: 'Welcome' }, { name: 'Login' }];
const PROFILE: StackRoute[] = [{ name: 'Profile' }];

function profileScreen(screen: string, path: string): ScreenPath {
	return {
		screen,
		path,
		tab: 'ProfileTab',
		routes: () => [...PROFILE, { name: screen }],
	};
}

export const SCREEN_PATHS: readonly ScreenPath[] = [
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
		isShareLink: true,
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
		routes: (id) => [...EVENT(id), { name: 'EventForm', params: { eventId: id } }],
	},
	{ screen: 'Search', path: 'search', tab: 'SearchTab', routes: () => [{ name: 'Search' }] },
	{ screen: 'Friends', path: 'friends', tab: 'FriendsTab', routes: () => [{ name: 'Friends' }] },
	{
		screen: 'UserProfile',
		path: 'user/:id',
		param: 'userId',
		tab: 'FriendsTab',
		routes: (id) => [{ name: 'Friends' }, { name: 'UserProfile', params: { userId: id } }],
		isShareLink: true,
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
