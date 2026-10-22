import React from 'react';
import { Share } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PlaylistHeader } from './PlaylistHeader';
import type { PlaylistWithTracks } from '@/types/playlist.types';
import type { UserProfile } from '@/types/user.types';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

jest.mock('./PlayPlaylistButton', () => ({
	PlayPlaylistButton: () => null,
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

	it('shows the username initials when the owner has no display name (#307)', () => {
		render(
			<PlaylistHeader
				playlist={{
					...playlist,
					owner: { id: 'owner', username: 'alice', displayName: null } as unknown as UserProfile,
				}}
			/>
		);

		expect(screen.getByText('AL')).toBeTruthy();
		expect(screen.getByText('alice')).toBeTruthy();
		expect(screen.queryByText('?')).toBeNull();
	});

	it('offers « Ajouter un titre » to an editor only (#307)', () => {
		const onAddTrack = jest.fn();
		const { rerender } = render(
			<PlaylistHeader playlist={playlist} canEdit={false} onAddTrack={onAddTrack} />
		);
		expect(screen.queryByText('Ajouter un titre')).toBeNull();

		rerender(<PlaylistHeader playlist={playlist} canEdit onAddTrack={onAddTrack} />);
		fireEvent.press(screen.getByText('Ajouter un titre'));
		expect(onAddTrack).toHaveBeenCalled();
	});
});
