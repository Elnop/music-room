import React from 'react';
import { Share } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TrackActionsSheet } from './TrackActionsSheet';
import { useAuthStore } from '@/store/authStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { useQueueStore } from '@/store/queueStore';
import { ApiError } from '@/shared/services/api';
import { showError, showSuccess } from '@/shared/utils/toast';
import type { Playlist } from '@/types/playlist.types';
import type { UserProfile } from '@/types/user.types';
import { logger } from '@/shared/utils/logger';

jest.mock('@/services/oauth', () => ({
	signInWithGoogle: jest.fn(),
	signInWithFacebook: jest.fn(),
}));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@/shared/utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

const track = {
	trackUri: 'https://soundcloud.com/artist/song',
	title: 'Song',
	artist: 'Artist',
	durationMs: 180_000,
};

const playlist = (id: string, name: string, overrides: Partial<Playlist> = {}): Playlist => ({
	id,
	name,
	ownerId: 'other',
	collaboratorIds: [],
	viewerIds: [],
	trackCount: 2,
	visibility: 'private',
	editMode: 'restricted',
	createdAt: '',
	updatedAt: '',
	...overrides,
});

const playlists = [
	playlist('mine', 'Mine', { ownerId: 'me' }),
	playlist('collab', 'Collab', { collaboratorIds: ['me'] }),
	playlist('open', 'Open public', { editMode: 'open', visibility: 'public' }),
	playlist('readonly', 'Read only', { visibility: 'public' }),
];

const onClose = jest.fn();
const playNext = jest.fn();
const addItem = jest.fn();
const addTrack = jest.fn();
const fetchPlaylists = jest.fn();

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	useAuthStore.setState({ user: { id: 'me' } as UserProfile, isAuthenticated: true });
	useQueueStore.setState({ playNext, addItem });
	usePlaylistStore.setState({ playlists, addTrack, fetchPlaylists });
	playNext.mockResolvedValue(true);
	addItem.mockResolvedValue(true);
	addTrack.mockResolvedValue(undefined);
	fetchPlaylists.mockResolvedValue(undefined);
});

const renderSheet = () => render(<TrackActionsSheet track={track} onClose={onClose} />);

describe('TrackActionsSheet', () => {
	it('shows the track and the four actions', () => {
		renderSheet();
		for (const text of [
			'Song',
			'Artist',
			'Lire ensuite',
			"Ajouter à la file d'attente",
			'Ajouter à une playlist',
			'Partager',
		]) {
			expect(screen.getByText(text)).toBeTruthy();
		}
	});

	it('plays next through the queue store and closes', () => {
		renderSheet();
		fireEvent.press(screen.getByText('Lire ensuite'));
		expect(onClose).toHaveBeenCalled();
		expect(playNext).toHaveBeenCalledWith(track);
		expect(addItem).not.toHaveBeenCalled();
	});

	it('adds to the end of the queue through the queue store and closes', () => {
		renderSheet();
		fireEvent.press(screen.getByText("Ajouter à la file d'attente"));
		expect(onClose).toHaveBeenCalled();
		expect(addItem).toHaveBeenCalledWith(track);
	});

	it('lists only the playlists I can edit, and adds the track to the picked one', async () => {
		renderSheet();
		fireEvent.press(screen.getByText('Ajouter à une playlist'));

		expect(fetchPlaylists).toHaveBeenCalledWith('me');
		expect(screen.getByText('Mine')).toBeTruthy();
		expect(screen.getByText('Collab')).toBeTruthy();
		expect(screen.getByText('Open public')).toBeTruthy();
		expect(screen.queryByText('Read only')).toBeNull();

		fireEvent.press(screen.getByText('Collab'));
		expect(onClose).toHaveBeenCalled();
		await waitFor(() => expect(showSuccess).toHaveBeenCalledWith('Ajouté à « Collab »'));
		expect(addTrack).toHaveBeenCalledWith('collab', track);
	});

	it('toasts a duplicate add', async () => {
		addTrack.mockRejectedValue(new ApiError('dup', 'TRACK_DUPLICATE', undefined, 409));
		renderSheet();
		fireEvent.press(screen.getByText('Ajouter à une playlist'));
		fireEvent.press(screen.getByText('Mine'));
		await waitFor(() =>
			expect(showError).toHaveBeenCalledWith('Ce titre est déjà dans la playlist')
		);
		expect(showSuccess).not.toHaveBeenCalled();
	});

	it('shows an empty message without an editable playlist', async () => {
		usePlaylistStore.setState({ playlists: [playlists[3]] });
		renderSheet();
		fireEvent.press(screen.getByText('Ajouter à une playlist'));
		expect(await screen.findByText('Aucune playlist modifiable')).toBeTruthy();
	});

	it('shares the SoundCloud permalink without a toast', async () => {
		const shareSpy = jest
			.spyOn(Share, 'share')
			.mockResolvedValue({ action: Share.sharedAction, activityType: null });
		renderSheet();
		fireEvent.press(screen.getByText('Partager'));
		expect(onClose).toHaveBeenCalled();
		expect(shareSpy).toHaveBeenCalledWith(
			expect.objectContaining({ message: track.trackUri, url: track.trackUri })
		);
		await waitFor(() => expect(shareSpy).toHaveBeenCalled());
		expect(showSuccess).not.toHaveBeenCalled();
	});

	it('toasts an error when sharing fails', async () => {
		jest.spyOn(Share, 'share').mockRejectedValue(new Error('boom'));
		renderSheet();
		fireEvent.press(screen.getByText('Partager'));
		await waitFor(() => expect(showError).toHaveBeenCalledWith('Impossible de partager ce titre'));
	});

	it('does nothing more when sharing is cancelled', async () => {
		jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.dismissedAction });
		renderSheet();
		fireEvent.press(screen.getByText('Partager'));
		await waitFor(() => expect(Share.share).toHaveBeenCalled());
		expect(showSuccess).not.toHaveBeenCalled();
		expect(showError).not.toHaveBeenCalled();
	});
});
