import React from 'react';
import { render, screen } from '@testing-library/react-native';
import type { Playlist } from '@/features/playlists/types';
import { PlaylistGridCard } from './PlaylistCards';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

const playlist = (overrides: Partial<Playlist> = {}): Playlist => ({
	id: 'p1',
	name: 'Road trip',
	ownerId: 'u1',
	owner: { id: 'u1', username: 'lea', displayName: 'Léa Martin' },
	collaboratorIds: [],
	viewerIds: [],
	trackCount: 12,
	visibility: 'public',
	editMode: 'open',
	createdAt: '',
	updatedAt: '',
	...overrides,
});

describe('PlaylistGridCard', () => {
	it("shows the owner's avatar, never « par … »", () => {
		render(<PlaylistGridCard playlist={playlist()} onPress={jest.fn()} />);
		expect(screen.getByText('LM', { includeHiddenElements: true })).toBeTruthy();
		expect(screen.queryByText(/^par /)).toBeNull();
		expect(screen.getByLabelText('Road trip, par Léa Martin')).toBeTruthy();
	});

	it('shows no badge when the list did not send the owner', () => {
		render(<PlaylistGridCard playlist={playlist({ owner: undefined })} onPress={jest.fn()} />);
		expect(screen.queryByText('LM', { includeHiddenElements: true })).toBeNull();
		expect(screen.getByLabelText('Road trip')).toBeTruthy();
	});
});
