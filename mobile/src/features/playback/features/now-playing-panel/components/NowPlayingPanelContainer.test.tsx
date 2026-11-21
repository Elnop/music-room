import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NowPlayingPanelContainer } from '@/features/playback/features/now-playing-panel/components/NowPlayingPanelContainer';
import { useNowPlayingPanelStore } from '@/features/playback/shared/panel/nowPlayingPanelStore';
import type { PlayerSheets } from '@/features/playback/shared/full-screen-sheet/FullScreenSheet';
import type { TrackActionsSheetProps } from '@/shared/playback/lib/trackActionsSheet';
import { THIS_DEVICE_LABEL } from '@/shared/platform/platform';
import type { NowPlaying } from '@/features/playback/shared/player/lib/types';
import type { OwnerQueue, QueueItem } from '@/shared/playback/lib/playback';
import { Text } from '@/shared/theme/components/Text';

let mockNowPlaying: NowPlaying;

jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/image-colors/useImageColors', () => ({
	...jest.requireActual('@/shared/image-colors/adaptivePalette'),
	useImageColors: () => ({ dominantColor: null, isLoading: false }),
}));

jest.mock('@/features/playback/shared/player/hooks/useNowPlaying', () => ({
	useNowPlaying: () => mockNowPlaying,
}));

function item(id: string, title: string): QueueItem {
	return {
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
	};
}

let mockQueue: OwnerQueue;
const mockPlayItem = jest.fn(async () => 'played' as const);

jest.mock('@/features/playback/shared/player/stores/queueStore', () => ({
	useActiveQueue: () => mockQueue,
	useQueueStore: { getState: () => ({ playItem: mockPlayItem }) },
}));

const sheets: PlayerSheets = {
	QueueModal: ({ visible }) => (visible ? <Text>queue-sheet</Text> : null),
	DevicePicker: ({ visible }) => (visible ? <Text>devices-sheet</Text> : null),
};

function TrackActionsSheet({ track, start }: TrackActionsSheetProps) {
	return track ? <Text>{`actions-sheet ${start} ${track.title}`}</Text> : null;
}

function playing(overrides: Partial<NowPlaying> = {}): NowPlaying {
	return {
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
	};
}

describe('NowPlayingPanelContainer', () => {
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
		render(<NowPlayingPanelContainer {...sheets} TrackActionsSheet={TrackActionsSheet} />);
		expect(screen.getAllByText('Goofy Goober Rock')).toHaveLength(1);
		expect(screen.getByText(THIS_DEVICE_LABEL)).toBeTruthy();
		expect(screen.getByText('Ripped Pants')).toBeTruthy();
		expect(screen.getByText('Sweet Victory')).toBeTruthy();
		expect(screen.queryByLabelText('Pause')).toBeNull();
		expect(screen.queryByLabelText('Piste suivante')).toBeNull();
	});

	it('names the remote device that plays', () => {
		mockNowPlaying = playing({ isRemote: true, deviceLabel: 'Pixel de Patrick' });
		render(<NowPlayingPanelContainer {...sheets} TrackActionsSheet={TrackActionsSheet} />);
		expect(screen.getByText('Pixel de Patrick')).toBeTruthy();
	});

	it('plays an item of the queue, and opens the whole queue and the device picker', () => {
		render(<NowPlayingPanelContainer {...sheets} TrackActionsSheet={TrackActionsSheet} />);
		fireEvent.press(screen.getByLabelText('Lire Sweet Victory, Matthew'));
		expect(mockPlayItem).toHaveBeenCalledWith('c');
		fireEvent.press(screen.getByLabelText("Afficher toute la file d'attente"));
		expect(screen.getByText('queue-sheet')).toBeTruthy();
		fireEvent.press(screen.getByLabelText("Choisir l'appareil"));
		expect(screen.getByText('devices-sheet')).toBeTruthy();
	});

	it('opens the track actions on the playlists or on the whole menu', () => {
		render(<NowPlayingPanelContainer {...sheets} TrackActionsSheet={TrackActionsSheet} />);
		fireEvent.press(screen.getByLabelText('Ajouter à une playlist'));
		expect(screen.getByText('actions-sheet playlists Goofy Goober Rock')).toBeTruthy();
		fireEvent.press(screen.getByLabelText('Actions'));
		expect(screen.getByText('actions-sheet actions Goofy Goober Rock')).toBeTruthy();
	});

	it('says when the queue has nothing after the track', () => {
		mockQueue = { currentItemId: 'a', items: [item('a', 'Goofy Goober Rock')], version: 1 };
		render(<NowPlayingPanelContainer {...sheets} TrackActionsSheet={TrackActionsSheet} />);
		expect(screen.getByText("Rien d'autre dans la file après ce titre.")).toBeTruthy();
	});

	it('closes with its button', () => {
		render(<NowPlayingPanelContainer {...sheets} TrackActionsSheet={TrackActionsSheet} />);
		fireEvent.press(screen.getByLabelText('Fermer le panneau'));
		expect(useNowPlayingPanelStore.getState().isOpen).toBe(false);
	});

	it('invites to pick a track when nothing plays', () => {
		mockNowPlaying = playing({ track: null, isPlaying: false });
		mockQueue = { currentItemId: null, items: [], version: 0 };
		render(<NowPlayingPanelContainer {...sheets} TrackActionsSheet={TrackActionsSheet} />);
		expect(screen.getByText('Rien en lecture : choisissez un titre pour commencer')).toBeTruthy();
		expect(screen.queryByLabelText('Ajouter à une playlist')).toBeNull();
	});
});
