import React from 'react';
import { render, screen } from '@testing-library/react-native';
import PlaySolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/play-solid.svg';
import { INK } from '@/shared/theme/lib/tokens';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';

describe('PixelIcon', () => {
	it('draws the SVG at the requested size and colour', () => {
		render(<PixelIcon icon={PlaySolid} color={INK} size={18} />);
		const svg = screen.getByTestId('svg-icon');

		expect(svg.props.style).toStrictEqual({ width: 18, height: 18 });
		expect(svg.props.accessibilityHint).toBe(INK);
	});

	it('is hidden from screen readers unless labelled', () => {
		render(<PixelIcon icon={PlaySolid} color={INK} testID="icon" />);

		expect(screen.getByTestId('icon').props.importantForAccessibility).toBe('no');
	});
});
