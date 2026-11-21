import React from 'react';
import { render, screen } from '@testing-library/react-native';
import type { Playlist } from '@/features/playlists/shared/playlist/lib/types';
import { PlaylistGridCard } from '@/features/playlists/features/browse/shared/playlist-grid/components/PlaylistCards';

jest.mock('@/shared/theme/hooks/useTheme', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/configs/originalThemeConfig');
	return { useTheme: () => ({ theme: originalTheme }) };
});

function playlist(overrides: Partial<Playlist> = {}): Playlist {
	return {
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
	};
}

describe('PlaylistGridCard', () => {
	it("shows the owner's avatar, never « par … »", () => {
		render(<PlaylistGridCard playlist={playlist()} onPress={jest.fn()} />);
		expect(screen.getByText('LM', { includeHiddenElements: true })).toBeTruthy();
		expect(screen.queryByText(/^par /u)).toBeNull();
		expect(screen.getByLabelText('Road trip, par Léa Martin')).toBeTruthy();
	});

	it('shows no badge when the list did not send the owner', () => {
		render(<PlaylistGridCard playlist={playlist({ owner: undefined })} onPress={jest.fn()} />);
		expect(screen.queryByText('LM', { includeHiddenElements: true })).toBeNull();
		expect(screen.getByLabelText('Road trip')).toBeTruthy();
	});
});
