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
