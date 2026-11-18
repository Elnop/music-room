import React from 'react';
import { PixelRatio, View, type ViewStyle } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { INK } from '@/shared/theme/tokens';
import { PixelIcon } from './PixelIcon';

const PIXEL_9_PRO_XL_RATIO = 2.25;

const runStyles = () =>
	screen
		.UNSAFE_getAllByType(View)
		.slice(1)
		.map(
			view =>
				view.props.style as ViewStyle & { top: number; height: number; left: number; width: number }
		);

describe('PixelIcon', () => {
	beforeEach(() => {
		jest.spyOn(PixelRatio, 'get').mockReturnValue(PIXEL_9_PRO_XL_RATIO);
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('puts every edge on a physical pixel at a size that is not a multiple of 24', () => {
		render(<PixelIcon name="globe" color={INK} size={18} />);
		const edges = runStyles().flatMap(run => [
			run.top,
			run.top + run.height,
			run.left,
			run.left + run.width,
		]);

		for (const edge of edges) {
			expect(Number.isInteger(Math.round(edge * PIXEL_9_PRO_XL_RATIO * 1000) / 1000)).toBe(true);
		}
	});
});
