import { largeArtwork } from '@/utils/artwork';

describe('largeArtwork', () => {
	it('asks SoundCloud for the 500×500 artwork', () => {
		expect(largeArtwork('https://i1.sndcdn.com/artworks-abc123-xyz-large.jpg')).toBe(
			'https://i1.sndcdn.com/artworks-abc123-xyz-t500x500.jpg'
		);
	});

	it('does the same for an avatar, keeping a query string', () => {
		expect(largeArtwork('https://i1.sndcdn.com/avatars-abc-large.png?v=2')).toBe(
			'https://i1.sndcdn.com/avatars-abc-t500x500.png?v=2'
		);
	});

	it('leaves other URLs alone', () => {
		expect(largeArtwork('https://example.com/cover-large.jpg')).toBe(
			'https://example.com/cover-large.jpg'
		);
		expect(largeArtwork('https://evilsndcdn.com/x-large.jpg')).toBe(
			'https://evilsndcdn.com/x-large.jpg'
		);
		expect(largeArtwork('https://i1.sndcdn.com/artworks-abc-t500x500.jpg')).toBe(
			'https://i1.sndcdn.com/artworks-abc-t500x500.jpg'
		);
	});

	it('returns null without a URL', () => {
		expect(largeArtwork(null)).toBeNull();
		expect(largeArtwork('')).toBeNull();
	});
});
