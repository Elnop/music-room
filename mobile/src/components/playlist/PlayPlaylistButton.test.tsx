import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { PlayPlaylistButton } from '@/components/playlist/PlayPlaylistButton';
import { usePlayerStore } from '@/store/playerStore';
import { useQueueStore } from '@/store/queueStore';
import { useAuthStore } from '@/store/authStore';
import type { QueueItem } from '@/types/queue.types';
import type { UserProfile } from '@/types/user.types';

jest.mock('@/lib/supabase', () => ({
	supabase: { auth: { signOut: jest.fn(), setSession: jest.fn() } },
}));

jest.mock('@services/oauth', () => ({
	signInWithGoogle: jest.fn(),
	signInWithFacebook: jest.fn(),
}));

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@/services/deviceService', () => ({
	getAppVersion: () => '1.2.3',
}));

jest.mock('@utils/toast', () => ({
	showSuccess: jest.fn(),
	showError: jest.fn(),
	showInfo: jest.fn(),
}));

const blockItem: QueueItem = {
	id: 'q1',
	rank: 'a',
	track: {
		trackUri: 'https://soundcloud.com/artist/q1',
		title: 'Q1',
		artist: 'Artist',
		album: null,
		albumArt: null,
		durationMs: 1000,
	},
	sourcePlaylistId: 'p1',
	blockId: 'blk',
	blockDetached: false,
};

const initialPlayer = usePlayerStore.getState();
const initialQueue = useQueueStore.getState();
const playPlaylist = jest.fn();
const pause = jest.fn();
const resume = jest.fn();

/** This device plays `blockItem` (queued from playlist p1) in `playbackState`. */
const playingFromP1 = (playbackState: 'playing' | 'paused') => {
	useQueueStore.setState({
		queues: { me: { currentItemId: 'q1', items: [blockItem], version: 1 } },
	});
	usePlayerStore.setState({ queueItemId: 'q1', playbackState });
};

const renderButton = async (playlistId = 'p1', trackCount = 2) => {
	render(<PlayPlaylistButton playlistId={playlistId} trackCount={trackCount} />);
	// Ionicons loads its font asynchronously and re-renders once it is ready.
	await act(async () => {});
};

beforeEach(() => {
	jest.clearAllMocks();
	useAuthStore.setState({ user: { id: 'me' } as UserProfile });
	usePlayerStore.setState({ ...initialPlayer, pause, resume }, true);
	useQueueStore.setState({ ...initialQueue, playPlaylist }, true);
	playPlaylist.mockResolvedValue('played');
});

describe('PlayPlaylistButton', () => {
	it('is hidden for an empty playlist', async () => {
		await renderButton('p1', 0);
		expect(screen.queryByRole('button')).toBeNull();
	});

	it('plays the playlist through the queue when nothing of it plays', async () => {
		await renderButton();
		expect(screen.getByRole('button')).toBeTruthy();
		await act(async () => {
			fireEvent.press(screen.getByLabelText('Lire la playlist'));
		});
		expect(playPlaylist).toHaveBeenCalledWith('p1');
	});

	it('shows Pause while an item of this playlist plays, and pauses', async () => {
		playingFromP1('playing');
		await renderButton();
		fireEvent.press(screen.getByLabelText('Mettre la playlist en pause'));
		expect(pause).toHaveBeenCalledTimes(1);
		expect(playPlaylist).not.toHaveBeenCalled();
	});

	it('resumes without a request when paused on this playlist', async () => {
		playingFromP1('paused');
		await renderButton();
		fireEvent.press(screen.getByLabelText('Lire la playlist'));
		expect(resume).toHaveBeenCalledTimes(1);
		expect(playPlaylist).not.toHaveBeenCalled();
	});

	it('shows Play when another playlist plays', async () => {
		playingFromP1('playing');
		await renderButton('p2');
		await act(async () => {
			fireEvent.press(screen.getByLabelText('Lire la playlist'));
		});
		expect(playPlaylist).toHaveBeenCalledWith('p2');
		expect(pause).not.toHaveBeenCalled();
	});

	it('ignores a second tap while the request runs', async () => {
		let resolve!: (value: string) => void;
		playPlaylist.mockReturnValue(new Promise(r => (resolve = r)));
		await renderButton();
		const button = screen.getByLabelText('Lire la playlist');
		fireEvent.press(button);
		fireEvent.press(button);
		expect(playPlaylist).toHaveBeenCalledTimes(1);
		await act(async () => {
			resolve('played');
		});
	});
});
