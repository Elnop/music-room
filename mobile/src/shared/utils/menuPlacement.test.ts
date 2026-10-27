import { menuPlacement } from './menuPlacement';

const window = { width: 1440, height: 900 };

describe('menuPlacement', () => {
	it('opens under the button, its right edge on the button', () => {
		expect(menuPlacement({ x: 1340, y: 20, width: 36, height: 36 }, window, 260)).toEqual({
			left: 1116,
			top: 60,
			maxHeight: 832,
		});
	});

	it('stays inside the window when the button is near its left edge', () => {
		expect(menuPlacement({ x: 10, y: 20, width: 32, height: 32 }, window, 260).left).toBe(8);
	});

	it('opens upwards from a button near the bottom of the window', () => {
		expect(menuPlacement({ x: 900, y: 800, width: 32, height: 32 }, window, 260)).toEqual({
			left: 672,
			bottom: 104,
			maxHeight: 788,
		});
	});

	it('keeps opening downwards while there is enough room', () => {
		const placement = menuPlacement({ x: 900, y: 500, width: 32, height: 32 }, window, 260);
		expect(placement.top).toBe(536);
	});

	it('opens a context menu at its point, to the right', () => {
		const point = { x: 600, y: 300, width: 0, height: 0, align: 'start' as const };
		expect(menuPlacement(point, window, 320)).toEqual({ left: 600, top: 304, maxHeight: 588 });
	});

	it('flips a context menu to the left of a point near the right edge', () => {
		const point = { x: 1300, y: 300, width: 0, height: 0, align: 'start' as const };
		expect(menuPlacement(point, window, 320).left).toBe(980);
	});

	it('keeps a context menu inside a window narrower than twice the menu', () => {
		const point = { x: 200, y: 300, width: 0, height: 0, align: 'start' as const };
		expect(menuPlacement(point, { width: 400, height: 900 }, 320).left).toBe(8);
	});
});
