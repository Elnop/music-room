import React from 'react';
import { render, screen } from '@testing-library/react-native';
import type { Playlist } from '@/features/playlists/types';
import { PlaylistGridCard } from './PlaylistCards';
import { PrivateBadge } from './PrivateBadge';

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
	it("shows the owner's avatar and the track count, never « par … »", () => {
		render(<PlaylistGridCard playlist={playlist()} onPress={jest.fn()} />);
		expect(screen.getByText('LM', { includeHiddenElements: true })).toBeTruthy();
		expect(screen.getByText('12 titres')).toBeTruthy();
		expect(screen.queryByText(/^par /)).toBeNull();
		expect(screen.getByLabelText('Road trip, par Léa Martin')).toBeTruthy();
	});

	it('keeps the private badge next to the avatar', () => {
		render(<PlaylistGridCard playlist={playlist({ visibility: 'private' })} onPress={jest.fn()} />);
		// Top right for the lock, bottom right for the avatar: they never overlap.
		expect(screen.UNSAFE_getByType(PrivateBadge).props.style).toMatchObject({ top: 8, right: 8 });
		expect(screen.getByText('LM', { includeHiddenElements: true })).toBeTruthy();
	});

	it('shows no badge when the list did not send the owner', () => {
		render(<PlaylistGridCard playlist={playlist({ owner: undefined })} onPress={jest.fn()} />);
		expect(screen.queryByText('LM', { includeHiddenElements: true })).toBeNull();
		expect(screen.getByLabelText('Road trip')).toBeTruthy();
	});
});
