import { renderHook } from '@testing-library/react-native';
import { getPlayback, usePlaylistPlayback } from '@/shared/services/playbackBridge';
import { usePlayerStore } from '@/features/player/stores/playerStore';
import { useQueueStore } from '@/features/queue/stores/queueStore';
import { useAuthStore } from '@/features/auth/stores/authStore';
import type { QueueItem } from '@/types/queue.types';
import type { UserProfile } from '@/types/user.types';
import { registerPlayback } from './playbackBridge';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@/features/player/context/PlayerContext', () => ({ usePlayerHeight: () => 64 }));
jest.mock('@/shared/services/deviceService', () => ({ getAppVersion: () => '1.2.3' }));

const item = { id: 'q1', sourcePlaylistId: 'p1' } as QueueItem;
const URI = 'https://soundcloud.com/a/song';
const addItem = jest.fn(() => Promise.resolve(true));
const playNext = jest.fn(() => Promise.resolve(true));
const playPlaylist = jest.fn(() => Promise.resolve('played' as const));
const pause = jest.fn();
const resume = jest.fn();

beforeAll(() => registerPlayback());

beforeEach(() => {
	useAuthStore.setState({ user: { id: 'me' } as UserProfile });
	useQueueStore.setState({
		queues: { me: { currentItemId: 'q1', items: [item], version: 1 } },
		addItem,
		playNext,
		playPlaylist,
	});
	usePlayerStore.setState({
		queueItemId: 'q1',
		playbackState: 'playing',
		currentTrack: { permalink_url: URI } as never,
		pause,
		resume,
	});
});

describe('registerPlayback', () => {
	it('reports what plays from a playlist, and nothing for another one', () => {
		expect(renderHook(() => usePlaylistPlayback('p1')).result.current).toEqual({
			playingUri: URI,
			state: 'playing',
		});
		expect(renderHook(() => usePlaylistPlayback('p2')).result.current).toEqual({
			playingUri: null,
			state: null,
		});
	});

	it('passes the actions to the queue and the player', async () => {
		const track = { trackUri: URI, title: 'S', artist: 'A', durationMs: 1 };
		const playback = getPlayback();
		await playback.addToQueue(track);
		await playback.playNext(track);
		await playback.playPlaylist('p1', 't3');
		playback.pause();
		playback.resume();
		expect(addItem).toHaveBeenCalledWith(track);
		expect(playNext).toHaveBeenCalledWith(track);
		expect(playPlaylist).toHaveBeenCalledWith('p1', 't3');
		expect(pause).toHaveBeenCalled();
		expect(resume).toHaveBeenCalled();
		expect(renderHook(() => playback.usePlayerHeight()).result.current).toBeGreaterThan(0);
	});
});
