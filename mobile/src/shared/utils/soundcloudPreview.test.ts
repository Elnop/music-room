import { isPreviewOnly } from './soundcloudPreview';

describe('isPreviewOnly', () => {
	it('flags a SNIP policy', () => {
		expect(isPreviewOnly({ policy: 'SNIP' })).toBe(true);
	});

	it('flags a track whose transcodings are all snipped', () => {
		expect(isPreviewOnly({ media: { transcodings: [{ snipped: true }, { snipped: true }] } })).toBe(
			true
		);
	});

	it('does not flag a full track', () => {
		expect(isPreviewOnly({ policy: 'ALLOW' })).toBe(false);
		expect(
			isPreviewOnly({ media: { transcodings: [{ snipped: true }, { snipped: false }] } })
		).toBe(false);
	});

	it('does not flag a track without these fields', () => {
		expect(isPreviewOnly({})).toBe(false);
		expect(isPreviewOnly({ media: { transcodings: [] } })).toBe(false);
		expect(isPreviewOnly({ media: { transcodings: [{}] } })).toBe(false);
	});
});
