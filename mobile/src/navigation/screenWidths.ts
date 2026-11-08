import type { ContentWidth } from '@/shared/constants/layout';

export const SCREEN_WIDTHS: Record<string, ContentWidth> = {
	Home: 'wide',
	Playlists: 'wide',
	Friends: 'wide',
	Search: 'content',
	PlaylistDetail: 'content',
	SearchTracks: 'content',
	PlaylistSharing: 'content',
	EventDetail: 'content',
	UserProfile: 'content',
	Profile: 'content',
	MyDevices: 'content',
	CreatePlaylist: 'form',
	EventForm: 'form',
	EditProfile: 'form',
	PrivacySettings: 'form',
	LinkedAccounts: 'form',
	MusicPreferences: 'form',
	Settings: 'form',
	Login: 'form',
	Register: 'form',
	EmailVerification: 'form',
	ForgotPassword: 'form',
	ResetPassword: 'form',
	PrivacyPolicy: 'form',
};

export const FULL_BLEED_SCREENS: ReadonlySet<string> = new Set(['PlaylistDetail']);

export const EDGE_SCROLL_SCREENS: ReadonlySet<string> = new Set([
	'Home',
	'Playlists',
	'Search',
	'Friends',
	'Profile',
	'UserProfile',
	'Settings',
]);
