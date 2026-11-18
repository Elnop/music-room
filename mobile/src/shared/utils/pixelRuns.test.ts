import { PIXEL_SPRITES } from '@/shared/constants/pixelSprites';
import { pixelRuns } from './pixelRuns';

describe('pixelRuns', () => {
	it('merges the lit pixels of a row into one run per stretch', () => {
		expect(pixelRuns(['.##..#', '......', '######'])).toEqual([
			{ x: 1, y: 0, width: 2 },
			{ x: 5, y: 0, width: 1 },
			{ x: 0, y: 2, width: 6 },
		]);
	});

	it.each(Object.entries(PIXEL_SPRITES))('draws %s on a 24×24 grid', (_, rows) => {
		expect(rows).toHaveLength(24);
		rows.forEach(row => expect(row).toMatch(/^[#.]{24}$/));
	});
});
