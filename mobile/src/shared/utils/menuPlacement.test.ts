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
});
