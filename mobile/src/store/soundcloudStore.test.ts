import { useSoundCloudStore } from '@/store/soundcloudStore';
import { apiRequest } from '@/services/api';
import type { SoundCloudSearchResult, SoundCloudTrack } from '@/types/soundcloud.types';

jest.mock('@/services/api', () => ({ apiRequest: jest.fn() }));

const request = apiRequest as jest.MockedFunction<typeof apiRequest>;

const initialState = useSoundCloudStore.getState();

const makeTrack = (id: number): SoundCloudTrack => ({
	id,
	title: `Track ${id}`,
	description: null,
	duration: 1000,
	genre: null,
	artwork_url: null,
	permalink_url: `https://soundcloud.com/artist/track-${id}`,
	user: {
		id: 1,
		username: 'artist',
		avatar_url: null,
		permalink_url: 'https://soundcloud.com/artist',
	},
	playable: true,
});

beforeEach(() => {
	useSoundCloudStore.setState(initialState, true);
	request.mockReset();
});

describe('soundcloudStore search', () => {
	it('clears results without calling the API for a blank query', async () => {
		useSoundCloudStore.setState({ searchResults: [makeTrack(1)], totalResults: 1 });

		await useSoundCloudStore.getState().search('   ');

		const state = useSoundCloudStore.getState();
		expect(state.searchResults).toEqual([]);
		expect(state.totalResults).toBe(0);
		expect(request).not.toHaveBeenCalled();
	});

	it('requests the search endpoint with the default limit and stores results', async () => {
		const tracks = [makeTrack(1), makeTrack(2)];
		const result: SoundCloudSearchResult = { collection: tracks, total_results: 57 };
		request.mockResolvedValue(result);
		useSoundCloudStore.setState({ error: 'previous' });

		await useSoundCloudStore.getState().search('daft punk');

		expect(request).toHaveBeenCalledWith('/api/soundcloud/search?q=daft+punk&limit=20');
		const state = useSoundCloudStore.getState();
		expect(state.searchResults).toEqual(tracks);
		expect(state.totalResults).toBe(57);
		expect(state.isSearching).toBe(false);
		expect(state.error).toBeNull();
	});

	it('keeps the shown results when a refresh fails, and still sets the error', async () => {
		const tracks = [makeTrack(1)];
		useSoundCloudStore.setState({ searchResults: tracks, totalResults: 1 });
		request.mockRejectedValue(new Error('Network down'));

		await useSoundCloudStore.getState().search('rock', undefined, { keepResultsOnError: true });

		const state = useSoundCloudStore.getState();
		expect(state.searchResults).toEqual(tracks);
		expect(state.error).toBe('Network down');
		expect(state.isSearching).toBe(false);
	});

	it('honours a custom limit', async () => {
		request.mockResolvedValue({ collection: [] });

		await useSoundCloudStore.getState().search('jazz', 5);

		expect(request).toHaveBeenCalledWith('/api/soundcloud/search?q=jazz&limit=5');
	});

	it('is searching while the request is pending', async () => {
		let resolve: (value: SoundCloudSearchResult) => void = () => undefined;
		request.mockReturnValue(
			new Promise<SoundCloudSearchResult>(r => {
				resolve = r;
			})
		);

		const pending = useSoundCloudStore.getState().search('rock');
		expect(useSoundCloudStore.getState().isSearching).toBe(true);

		resolve({ collection: [] });
		await pending;
		expect(useSoundCloudStore.getState().isSearching).toBe(false);
	});

	it('defaults missing fields to an empty list and zero', async () => {
		request.mockResolvedValue({} as SoundCloudSearchResult);

		await useSoundCloudStore.getState().search('nothing');

		const state = useSoundCloudStore.getState();
		expect(state.searchResults).toEqual([]);
		expect(state.totalResults).toBe(0);
		expect(state.isSearching).toBe(false);
	});

	it('stores the error message when the request fails with an Error', async () => {
		useSoundCloudStore.setState({ searchResults: [makeTrack(1)] });
		request.mockRejectedValue(new Error('x'));

		await useSoundCloudStore.getState().search('fail');

		const state = useSoundCloudStore.getState();
		expect(state.error).toBe('x');
		expect(state.searchResults).toEqual([]);
		expect(state.isSearching).toBe(false);
	});

	it('uses a generic message when the request fails with a non-Error', async () => {
		request.mockRejectedValue('nope');

		await useSoundCloudStore.getState().search('fail');

		const state = useSoundCloudStore.getState();
		expect(state.error).toBe('La recherche a échoué');
		expect(state.searchResults).toEqual([]);
		expect(state.isSearching).toBe(false);
	});
});

describe('soundcloudStore clear actions', () => {
	it('clearSearch resets results, total and error', () => {
		useSoundCloudStore.setState({
			searchResults: [makeTrack(1)],
			totalResults: 1,
			error: 'boom',
		});

		useSoundCloudStore.getState().clearSearch();

		const state = useSoundCloudStore.getState();
		expect(state.searchResults).toEqual([]);
		expect(state.totalResults).toBe(0);
		expect(state.error).toBeNull();
	});

	it('clearError removes the error only', () => {
		const tracks = [makeTrack(1)];
		useSoundCloudStore.setState({ searchResults: tracks, error: 'boom' });

		useSoundCloudStore.getState().clearError();

		expect(useSoundCloudStore.getState().error).toBeNull();
		expect(useSoundCloudStore.getState().searchResults).toEqual(tracks);
	});
});

describe('soundcloudStore stale answers (#349)', () => {
	const deferred = () => {
		let resolve!: (value: SoundCloudSearchResult) => void;
		let reject!: (error: Error) => void;
		const promise = new Promise<SoundCloudSearchResult>((res, rej) => {
			resolve = res;
			reject = rej;
		});
		return { promise, resolve, reject };
	};

	it('drops the answer of a search cleared while in flight, and stops loading', async () => {
		const pending = deferred();
		request.mockReturnValueOnce(pending.promise as never);

		const search = useSoundCloudStore.getState().search('daft');
		expect(useSoundCloudStore.getState().isSearching).toBe(true);

		useSoundCloudStore.getState().clearSearch();
		expect(useSoundCloudStore.getState().isSearching).toBe(false);

		pending.resolve({ collection: [makeTrack(1)], total_results: 1 });
		await search;

		const state = useSoundCloudStore.getState();
		expect(state.searchResults).toEqual([]);
		expect(state.isSearching).toBe(false);
	});

	it('keeps the newest results when an older search answers last', async () => {
		const first = deferred();
		const second = deferred();
		request
			.mockReturnValueOnce(first.promise as never)
			.mockReturnValueOnce(second.promise as never);

		const older = useSoundCloudStore.getState().search('a');
		const newer = useSoundCloudStore.getState().search('ab');

		second.resolve({ collection: [makeTrack(2)], total_results: 1 });
		await newer;
		first.resolve({ collection: [makeTrack(1)], total_results: 1 });
		await older;

		const state = useSoundCloudStore.getState();
		expect(state.searchResults.map(t => t.id)).toEqual([2]);
		expect(state.isSearching).toBe(false);
	});

	it('ignores the failure of a search overtaken by a newer one', async () => {
		const first = deferred();
		request
			.mockReturnValueOnce(first.promise as never)
			.mockResolvedValueOnce({ collection: [makeTrack(3)], total_results: 1 });

		const older = useSoundCloudStore.getState().search('a');
		await useSoundCloudStore.getState().search('ab');
		first.reject(new Error('timeout'));
		await older;

		const state = useSoundCloudStore.getState();
		expect(state.error).toBeNull();
		expect(state.searchResults.map(t => t.id)).toEqual([3]);
	});

	it('stops loading when a blank query replaces a search in flight', async () => {
		const pending = deferred();
		request.mockReturnValueOnce(pending.promise as never);

		const search = useSoundCloudStore.getState().search('daft');
		await useSoundCloudStore.getState().search('  ');
		pending.resolve({ collection: [makeTrack(1)], total_results: 1 });
		await search;

		const state = useSoundCloudStore.getState();
		expect(state.isSearching).toBe(false);
		expect(state.searchResults).toEqual([]);
	});
});
