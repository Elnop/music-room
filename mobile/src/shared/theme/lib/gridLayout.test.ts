import { rowColumns, tileColumns, tileWidth } from './gridLayout';

describe('tileColumns', () => {
	it('keeps two columns on the phone, whatever its width', () => {
		expect(tileColumns(375, 'phone')).toBe(2);
		expect(tileColumns(767, 'phone')).toBe(2);
	});

	it('fits more columns on wider content', () => {
		expect(tileColumns(704, 'tablet')).toBe(3);
		expect(tileColumns(1208, 'desktop')).toBe(6);
	});
});

describe('tileWidth', () => {
	it('is the phone grid width the cards always had', () => {
		expect(tileWidth(375, 'phone')).toBe((375 - 48 - 8) / 2);
	});

	it('never goes below the minimum tile width on wide screens', () => {
		for (const width of [704, 800, 960, 1208, 1280]) {
			expect(tileWidth(width, width < 1024 ? 'tablet' : 'desktop')).toBeGreaterThan(170);
		}
	});
});

describe('rowColumns', () => {
	it('is one column on the phone and more on wider screens', () => {
		expect(rowColumns('phone')).toBe(1);
		expect(rowColumns('tablet')).toBe(2);
		expect(rowColumns('desktop')).toBe(3);
	});
});
