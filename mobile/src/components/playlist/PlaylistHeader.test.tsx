import React from 'react';
import { Share } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PlaylistHeader } from '@/components/playlist/PlaylistHeader';
import type { PlaylistWithTracks } from '@/types/playlist.types';
import type { UserProfile } from '@/types/user.types';

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

const ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';

const playlist = {
	id: ID,
	name: 'Chill',
	ownerId: 'owner',
	collaboratorIds: [],
	viewerIds: [],
	visibility: 'public',
	editMode: 'restricted',
	createdAt: '',
	updatedAt: '',
	tracks: [],
	tracksVersion: 0,
	owner: { id: 'owner', username: 'alice', displayName: 'Alice' } as UserProfile,
} as unknown as PlaylistWithTracks;

describe('PlaylistHeader', () => {
	it('shares the zumik:// link of the playlist', async () => {
		const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
		render(<PlaylistHeader playlist={playlist} />);

		fireEvent.press(screen.getByRole('button', { name: 'Partager' }));

		await waitFor(() =>
			expect(share).toHaveBeenCalledWith({
				message: `Chill\nzumik://playlist/${ID}`,
				title: 'Chill',
			})
		);
	});
});
