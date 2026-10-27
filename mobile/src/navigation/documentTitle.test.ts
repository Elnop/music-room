import { formatDocumentTitle } from './documentTitle';

describe('formatDocumentTitle', () => {
	it('follows the screen title with the app name', () => {
		expect(formatDocumentTitle({ title: 'Playlists' })).toBe('Playlists · Zumik');
	});

	it('keeps the app name alone for a screen without a title', () => {
		expect(formatDocumentTitle({ title: '' })).toBe('Zumik');
		expect(formatDocumentTitle(undefined)).toBe('Zumik');
	});
});
