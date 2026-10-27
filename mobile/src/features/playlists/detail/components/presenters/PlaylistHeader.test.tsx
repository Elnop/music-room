import React from 'react';
import { Share } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { PlaylistHeader } from './PlaylistHeader';
import type { PlaylistWithTracks } from '@/features/playlists/types';
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
	it('shares the https link of the playlist', async () => {
		const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });
		render(
			<PlaylistHeader
				playlist={playlist}
				playButton={null}
				canEdit={false}
				onAddTrack={jest.fn()}
			/>
		);

		fireEvent.press(screen.getByRole('button', { name: 'Partager' }));

		await waitFor(() =>
			expect(share).toHaveBeenCalledWith({
				message: `Chill\nhttps://elnop.github.io/music-room/playlist/${ID}`,
				title: 'Chill',
			})
		);
	});

	it('shows the username initials when the owner has no display name (#307)', () => {
		render(
			<PlaylistHeader
				playButton={null}
				canEdit={false}
				onAddTrack={jest.fn()}
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
			<PlaylistHeader
				playlist={playlist}
				playButton={null}
				canEdit={false}
				onAddTrack={onAddTrack}
			/>
		);
		expect(screen.queryByText('Ajouter un titre')).toBeNull();

		rerender(
			<PlaylistHeader playlist={playlist} playButton={null} canEdit onAddTrack={onAddTrack} />
		);
		fireEvent.press(screen.getByText('Ajouter un titre'));
		expect(onAddTrack).toHaveBeenCalled();
	});
});

describe('PlaylistHeader play button', () => {
	it('shows the play button only next to a non-empty playlist', () => {
		const { Text } = jest.requireActual('react-native');
		const button = <Text>PLAY</Text>;
		const { rerender } = render(
			<PlaylistHeader
				playlist={playlist}
				playButton={button}
				canEdit={false}
				onAddTrack={jest.fn()}
			/>
		);
		expect(screen.queryByText('PLAY')).toBeNull();
		rerender(
			<PlaylistHeader
				playlist={{ ...playlist, tracks: [{ id: 't' }] } as unknown as PlaylistWithTracks}
				playButton={button}
				canEdit={false}
				onAddTrack={jest.fn()}
			/>
		);
		expect(screen.getByText('PLAY')).toBeTruthy();
		expect(screen.getByText('1 titre')).toBeTruthy();
	});
});
