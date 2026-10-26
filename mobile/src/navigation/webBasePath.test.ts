import { restoreRedirectedPath, stripBasePath, webBasePath } from './webBasePath';

const ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';
const BASE = '/music-room/app';

const fakeLocation = (search: string, hash = '') => ({ pathname: `${BASE}/`, search, hash });
const fakeHistory = () => ({ replaceState: jest.fn() });

describe('webBasePath', () => {
	const original = process.env.EXPO_BASE_URL;
	afterEach(() => {
		if (original === undefined) delete process.env.EXPO_BASE_URL;
		else process.env.EXPO_BASE_URL = original;
	});

	it('is empty at the root', () => {
		delete process.env.EXPO_BASE_URL;
		expect(webBasePath()).toBe('');
	});

	it('drops the trailing slash of experiments.baseUrl', () => {
		process.env.EXPO_BASE_URL = `${BASE}/`;
		expect(webBasePath()).toBe(BASE);
	});
});

describe('stripBasePath', () => {
	it.each([
		[`${BASE}/playlist/${ID}`, `/playlist/${ID}`],
		[BASE, '/'],
		[`${BASE}/`, '/'],
		[`${BASE}?x=1`, '?x=1'],
		[`/music-room/application/user/${ID}`, `/music-room/application/user/${ID}`],
		[`/user/${ID}`, `/user/${ID}`],
	])('maps %j to %j', (path, expected) => {
		expect(stripBasePath(path, BASE)).toBe(expected);
	});

	it('keeps the path without a base', () => {
		expect(stripBasePath(`/playlist/${ID}`, '')).toBe(`/playlist/${ID}`);
	});
});

describe('restoreRedirectedPath', () => {
	it('puts the path and hash from 404.html back under the base path', () => {
		const history = fakeHistory();
		const redirect = encodeURIComponent(`/playlist/${ID}?tab=tracks`);
		restoreRedirectedPath(fakeLocation(`?redirect=${redirect}`, '#top'), history, BASE);
		expect(history.replaceState).toHaveBeenCalledWith(
			null,
			'',
			`${BASE}/playlist/${ID}?tab=tracks#top`
		);
	});

	it.each([
		'',
		'?other=1',
		'?redirect=',
		'?redirect=playlist',
		'?redirect=%2F%2Fevil.example',
		'?redirect=%E0%A4%A',
	])('leaves the address of %j alone', search => {
		const history = fakeHistory();
		restoreRedirectedPath(fakeLocation(search), history, BASE);
		expect(history.replaceState).not.toHaveBeenCalled();
	});

	it('does nothing outside a browser', () => {
		expect(() => restoreRedirectedPath(undefined, undefined, BASE)).not.toThrow();
	});
});
