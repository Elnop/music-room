import AsyncStorage from '@react-native-async-storage/async-storage';
import { lastTrackStorage, type LastTrackEntry } from '@/services/lastTrackStorage';
import { logger } from '@/utils/logger';

jest.mock('@react-native-async-storage/async-storage', () =>
	jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const entry: LastTrackEntry = {
	track: {
		trackUri: 'https://soundcloud.com/artist/song',
		title: 'Song',
		artist: 'Artist',
		album: null,
		albumArt: 'https://img/art.jpg',
		durationMs: 200_000,
	},
	queueItemId: 'q1',
	positionMs: 42_000,
};

const KEY = 'zumik:lastTrack:me';

beforeEach(async () => {
	await AsyncStorage.clear();
	jest.spyOn(logger, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe('lastTrackStorage', () => {
	it('saves and loads an entry per user', async () => {
		await lastTrackStorage.save('me', entry);

		expect(await lastTrackStorage.load('me')).toEqual(entry);
		expect(await lastTrackStorage.load('other')).toBeNull();
	});

	it('never stores a stream URL', async () => {
		const withStream = { ...entry, streamUrl: 'https://cf-media/stream?sig=1' } as LastTrackEntry;
		await lastTrackStorage.save('me', withStream);

		const raw = await AsyncStorage.getItem(KEY);
		expect(raw).not.toContain('streamUrl');
		expect(raw).not.toContain('cf-media');
	});

	it('returns null when nothing is saved', async () => {
		expect(await lastTrackStorage.load('me')).toBeNull();
	});

	it.each([
		['invalid JSON', '{not json'],
		['a wrong shape', JSON.stringify({ track: { title: 'x' }, positionMs: -1 })],
	])('ignores and deletes %s', async (_label, raw) => {
		await AsyncStorage.setItem(KEY, raw);

		expect(await lastTrackStorage.load('me')).toBeNull();
		expect(await AsyncStorage.getItem(KEY)).toBeNull();
	});

	it('clears the entry', async () => {
		await lastTrackStorage.save('me', entry);
		await lastTrackStorage.clear('me');

		expect(await AsyncStorage.getItem(KEY)).toBeNull();
	});

	it('treats an unreadable entry as empty and deletes it', async () => {
		await lastTrackStorage.save('me', entry);
		jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));

		expect(await lastTrackStorage.load('me')).toBeNull();
		expect(await AsyncStorage.getItem(KEY)).toBeNull();
	});

	it('deletes the previous entry when the new one is invalid', async () => {
		await lastTrackStorage.save('me', entry);
		await lastTrackStorage.save('me', { ...entry, positionMs: Number.NaN });

		expect(await AsyncStorage.getItem(KEY)).toBeNull();
	});
});
