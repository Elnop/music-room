import React from 'react';
import { Share } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { TrackActionsSheet } from './TrackActionsSheet';
import { testPlayback } from '@/test/playback';
import { resetBackendUrl } from '@/shared/services/backendUrl';
import { showError, showSuccess } from '@/shared/utils/toast';
import type { Playlist } from '@/features/playlists/types';
import { logger } from '@/shared/utils/logger';
import { renderWithClient } from '@/test/renderWithClient';
import { mockFetchRoutes } from '@/test/fetchRoutes';
import { fail, ok } from '@/test/fetchResponses';
import { signIn } from '@/test/session';
import { playlistTrack } from '@/test/playlistFixtures';

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

jest.mock('socket.io-client', () => ({ io: jest.fn() }));

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
const { playNext, addToQueue: addItem } = testPlayback;
let routes: ReturnType<typeof mockFetchRoutes>;
let clear: () => void = () => undefined;

const added = ok({ track: playlistTrack('t', 'z'), tracksVersion: 3, rebalanced: false });

beforeEach(async () => {
	jest.clearAllMocks();
	jest.spyOn(logger, 'error').mockImplementation(() => undefined);
	await resetBackendUrl();
	signIn('me');
	routes = mockFetchRoutes({
		'GET /api/playlists': ok({ playlists }),
		'POST /api/playlists/collab/tracks': added,
	});
});

afterEach(() => {
	clear();
	jest.restoreAllMocks();
});

const renderSheet = () => {
	const view = renderWithClient(<TrackActionsSheet track={track} onClose={onClose} />);
	clear = () => view.client.clear();
	return view;
};

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

		expect(screen.getByTestId('track-actions-loading')).toBeTruthy();
		expect(await screen.findByText('Mine')).toBeTruthy();
		expect(routes.calls()).toEqual(['GET /api/playlists']);
		expect(screen.getByText('Collab')).toBeTruthy();
		expect(screen.getByText('Open public')).toBeTruthy();
		expect(screen.queryByText('Read only')).toBeNull();

		fireEvent.press(screen.getByText('Collab'));
		expect(onClose).toHaveBeenCalled();
		await waitFor(() => expect(showSuccess).toHaveBeenCalledWith('Ajouté à « Collab »'));
		expect(routes.fetchMock.mock.calls.at(-1)?.[1]?.body).toBe(JSON.stringify(track));
	});

	it('toasts a duplicate add', async () => {
		routes.routes['POST /api/playlists/mine/tracks'] = fail(409, 'TRACK_DUPLICATE');
		renderSheet();
		fireEvent.press(screen.getByText('Ajouter à une playlist'));
		fireEvent.press(await screen.findByText('Mine'));
		await waitFor(() =>
			expect(showError).toHaveBeenCalledWith('Ce titre est déjà dans la playlist')
		);
		expect(showSuccess).not.toHaveBeenCalled();
	});

	it('shows an empty message without an editable playlist', async () => {
		routes.routes['GET /api/playlists'] = ok({ playlists: [playlists[3]] });
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
