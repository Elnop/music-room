import React from 'react';
import { ContentContainer } from '@/shared/components/layout/ContentContainer';
import type { ContentWidth } from '@/shared/constants/layout';

/** Grids get the widest column, forms the narrowest; a screen not listed (Welcome) stays full width. */
const SCREEN_WIDTHS: Record<string, ContentWidth> = {
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

interface ScreenLayoutArgs {
	route: { name: string };
	children: React.ReactElement;
}

/** A navigator's `screenLayout`: centres each screen at its width on wide screens. */
export const screenLayout =
	(besideSidebar: boolean) =>
	({ route, children }: ScreenLayoutArgs) => {
		const width = SCREEN_WIDTHS[route.name];
		if (!width) return children;
		return (
			<ContentContainer width={width} besideSidebar={besideSidebar}>
				{children}
			</ContentContainer>
		);
	};
