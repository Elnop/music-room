import { usePlayerStore } from '@/features/playback/shared/player/stores/playerStore';
import { useQueueStore } from '@/features/playback/shared/player/stores/queueStore';
import { playbackActions } from './playbackActions';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/shared/backend/deviceService', () => ({ getAppVersion: () => '1.2.3' }));

const URI = 'https://soundcloud.com/a/song';
const addItem = jest.fn(() => Promise.resolve(true));
const playNext = jest.fn(() => Promise.resolve(true));
const playListTrack = jest.fn(() => Promise.resolve());
const playPlaylist = jest.fn(() => Promise.resolve('played' as const));
const pause = jest.fn();
const resume = jest.fn();

beforeEach(() => {
	useQueueStore.setState({ addItem, playNext, playListTrack, playPlaylist });
	usePlayerStore.setState({ pause, resume });
});

describe('playbackActions', () => {
	it('passes the actions to the queue and the player', async () => {
		const track = { trackUri: URI, title: 'S', artist: 'A', durationMs: 1 };
		const listTrack = { permalink_url: URI } as never;
		await playbackActions.addToQueue(track);
		await playbackActions.playNext(track);
		await playbackActions.playListTrack(listTrack);
		await playbackActions.playPlaylist('p1', 't3');
		playbackActions.pause();
		playbackActions.resume();
		expect(addItem).toHaveBeenCalledWith(track);
		expect(playNext).toHaveBeenCalledWith(track);
		expect(playListTrack).toHaveBeenCalledWith(listTrack);
		expect(playPlaylist).toHaveBeenCalledWith('p1', 't3');
		expect(pause).toHaveBeenCalled();
		expect(resume).toHaveBeenCalled();
	});
});
