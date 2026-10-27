import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NowPlayingPanel } from './NowPlayingPanel';
import { useNowPlayingPanelStore } from '@/shared/stores/nowPlayingPanelStore';
import { registerPlaybackBridge, type OwnerQueue } from '@/shared/services/playbackBridge';
import { registerPlayerModals } from '@/shared/services/playerModalsBridge';
import { registerTrackActionsSheet } from '@/shared/services/trackActionsBridge';
import { THIS_DEVICE_LABEL } from '@/shared/constants/platform';
import type { NowPlaying } from '@/features/player/types';
import type { QueueItem } from '@/shared/types/playback';
import { Text } from '@/shared/components/ui/Text';

let mockNowPlaying: NowPlaying;

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/hooks/useImageColors', () => ({
	...jest.requireActual('@/shared/theme/adaptivePalette'),
	useImageColors: () => ({ dominantColor: null, isLoading: false }),
}));

jest.mock('@/features/player/hooks/useNowPlaying', () => ({
	useNowPlaying: () => mockNowPlaying,
}));

const item = (id: string, title: string): QueueItem => ({
	id,
	rank: id,
	track: {
		trackUri: `https://soundcloud.com/artist/${id}`,
		title,
		artist: 'Matthew',
		album: null,
		albumArt: null,
		durationMs: 1000,
	},
	sourcePlaylistId: null,
	blockId: null,
	blockDetached: false,
});

let mockQueue: OwnerQueue;
const mockPlayItem = jest.fn(async () => 'played' as const);

registerPlaybackBridge({
	usePlaylistPlayback: () => ({ playingUri: null, state: null }),
	useActiveQueue: () => mockQueue,
	addToQueue: jest.fn(async () => true),
	playNext: jest.fn(async () => true),
	playPlaylist: jest.fn(async () => 'played'),
	next: jest.fn(async () => 'played'),
	previous: jest.fn(async () => 'played'),
	playItem: mockPlayItem,
	playListTrack: jest.fn(async () => undefined),
	playTrack: jest.fn(),
	pause: jest.fn(),
	resume: jest.fn(),
	stop: jest.fn(),
	getPlayerState: () => ({ currentTrack: null, queueItemId: null, loadCounter: 0, positionMs: 0 }),
});

registerPlayerModals({
	QueueModal: ({ visible }) => (visible ? <Text>queue-sheet</Text> : null),
	DevicePickerSheet: ({ visible }) => (visible ? <Text>devices-sheet</Text> : null),
});

registerTrackActionsSheet(({ track, start }) =>
	track ? <Text>{`actions-sheet ${start} ${track.title}`}</Text> : null
);

const playing = (overrides: Partial<NowPlaying> = {}): NowPlaying => ({
	isRemote: false,
	track: { id: 1, title: 'Goofy Goober Rock', artist: 'Matthew', artworkUrl: null },
	isPlaying: true,
	isLoading: false,
	canToggle: true,
	positionMs: 0,
	durationMs: 1000,
	deviceLabel: null,
	toggle: jest.fn(),
	next: jest.fn(),
	previous: jest.fn(),
	hasNext: true,
	hasPrevious: false,
	...overrides,
});

describe('NowPlayingPanel', () => {
	beforeEach(() => {
		jest.clearAllMocks();
		mockNowPlaying = playing();
		mockQueue = {
			currentItemId: 'a',
			items: [
				item('a', 'Goofy Goober Rock'),
				item('b', 'Ripped Pants'),
				item('c', 'Sweet Victory'),
			],
			version: 1,
		};
		useNowPlayingPanelStore.setState({ isOpen: true });
	});

	it('shows the track, the device and what comes next, without the transport of the bar', () => {
		render(<NowPlayingPanel />);
		expect(screen.getAllByText('Goofy Goober Rock')).toHaveLength(1);
		expect(screen.getByText(THIS_DEVICE_LABEL)).toBeTruthy();
		expect(screen.getByText('Ripped Pants')).toBeTruthy();
		expect(screen.getByText('Sweet Victory')).toBeTruthy();
		expect(screen.queryByLabelText('Pause')).toBeNull();
		expect(screen.queryByLabelText('Piste suivante')).toBeNull();
	});

	it('names the remote device that plays', () => {
		mockNowPlaying = playing({ isRemote: true, deviceLabel: 'Pixel de Patrick' });
		render(<NowPlayingPanel />);
		expect(screen.getByText('Pixel de Patrick')).toBeTruthy();
	});

	it('plays an item of the queue, and opens the whole queue and the device picker', () => {
		render(<NowPlayingPanel />);
		fireEvent.press(screen.getByLabelText('Lire Sweet Victory, Matthew'));
		expect(mockPlayItem).toHaveBeenCalledWith('c');
		fireEvent.press(screen.getByLabelText("Afficher toute la file d'attente"));
		expect(screen.getByText('queue-sheet')).toBeTruthy();
		fireEvent.press(screen.getByLabelText("Choisir l'appareil"));
		expect(screen.getByText('devices-sheet')).toBeTruthy();
	});

	it('opens the track actions on the playlists or on the whole menu', () => {
		render(<NowPlayingPanel />);
		fireEvent.press(screen.getByLabelText('Ajouter à une playlist'));
		expect(screen.getByText('actions-sheet playlists Goofy Goober Rock')).toBeTruthy();
		fireEvent.press(screen.getByLabelText('Actions'));
		expect(screen.getByText('actions-sheet actions Goofy Goober Rock')).toBeTruthy();
	});

	it('says when the queue has nothing after the track', () => {
		mockQueue = { currentItemId: 'a', items: [item('a', 'Goofy Goober Rock')], version: 1 };
		render(<NowPlayingPanel />);
		expect(screen.getByText("Rien d'autre dans la file après ce titre.")).toBeTruthy();
	});

	it('closes with its button', () => {
		render(<NowPlayingPanel />);
		fireEvent.press(screen.getByLabelText('Fermer le panneau'));
		expect(useNowPlayingPanelStore.getState().isOpen).toBe(false);
	});

	it('invites to pick a track when nothing plays', () => {
		mockNowPlaying = playing({ track: null, isPlaying: false });
		mockQueue = { currentItemId: null, items: [], version: 0 };
		render(<NowPlayingPanel />);
		expect(screen.getByText('Rien en lecture : choisissez un titre pour commencer')).toBeTruthy();
		expect(screen.queryByLabelText('Ajouter à une playlist')).toBeNull();
	});
});
