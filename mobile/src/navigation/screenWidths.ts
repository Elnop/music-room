import type { ContentWidth } from '@/shared/constants/layout';

/** Grids get the widest column, forms the narrowest; a screen not listed (Welcome) stays full width. */
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
};
