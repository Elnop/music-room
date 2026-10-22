import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { testPlayback } from '@/test/playback';
import { showInfo } from '@/shared/utils/toast';
import { PlayPlaylistButton } from '@/features/playlists/detail/components/presenters/PlayPlaylistButton';
import { usePlayPlaylist } from './usePlayPlaylist';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});
jest.mock('@/shared/utils/toast', () => ({ showInfo: jest.fn() }));

const { playPlaylist, pause, resume } = testPlayback;
const setState = (state: 'playing' | 'paused' | 'loading' | null) => {
	testPlayback.playing = { playingUri: null, state };
};

function Harness({ playlistId }: { playlistId: string }) {
	return <PlayPlaylistButton play={usePlayPlaylist(playlistId)} />;
}

const renderButton = async (playlistId = 'p1') => {
	render(<Harness playlistId={playlistId} />);
	// Ionicons loads its font asynchronously and re-renders once it is ready.
	await act(async () => {});
};

beforeEach(() => {
	jest.clearAllMocks();
	setState(null);
	playPlaylist.mockResolvedValue('played');
});

describe('PlayPlaylistButton (#277)', () => {
	it('plays the playlist through the queue when nothing of it plays', async () => {
		await renderButton();
		await act(async () => fireEvent.press(screen.getByLabelText('Lire la playlist')));
		expect(playPlaylist).toHaveBeenCalledWith('p1');
	});

	it('shows Pause while an item of this playlist plays, and pauses', async () => {
		setState('playing');
		await renderButton();
		fireEvent.press(screen.getByLabelText('Mettre la playlist en pause'));
		expect(pause).toHaveBeenCalledTimes(1);
		expect(playPlaylist).not.toHaveBeenCalled();
	});

	it('resumes without a request when paused on this playlist', async () => {
		setState('paused');
		await renderButton();
		fireEvent.press(screen.getByLabelText('Lire la playlist'));
		expect(resume).toHaveBeenCalledTimes(1);
		expect(playPlaylist).not.toHaveBeenCalled();
	});

	it('is busy while its track loads', async () => {
		setState('loading');
		await renderButton();
		expect(screen.getByLabelText('Lire la playlist').props.accessibilityState.busy).toBe(true);
	});

	it('ignores a second tap while the request runs, then says another action runs', async () => {
		let resolve!: (value: string) => void;
		playPlaylist.mockReturnValue(new Promise(r => (resolve = r)));
		await renderButton();
		const button = screen.getByLabelText('Lire la playlist');
		fireEvent.press(button);
		fireEvent.press(button);
		expect(playPlaylist).toHaveBeenCalledTimes(1);
		await act(async () => resolve('ignored'));
		expect(showInfo).toHaveBeenCalledWith('Une action est déjà en cours');
	});
});
