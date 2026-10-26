import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { RowGrid } from './RowGrid';
import { Text } from '@/shared/components/ui/Text';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(),
}));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme: theme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme }) };
});

const mockWidth = (width: number) =>
	jest.mocked(useWindowDimensions).mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });

const cellWidths = () =>
	screen
		.UNSAFE_getAllByType(View)
		.map(view => StyleSheet.flatten(view.props.style)?.width)
		.filter(Boolean);

const renderRows = () =>
	render(
		<RowGrid>
			<Text>one</Text>
			<Text>two</Text>
			<Text>three</Text>
		</RowGrid>
	);

describe('RowGrid', () => {
	it('leaves the rows as they are on the phone', () => {
		mockWidth(375);
		renderRows();
		expect(screen.getByText('two')).toBeTruthy();
		expect(screen.UNSAFE_queryAllByType(View)).toHaveLength(0);
	});

	it('puts two rows side by side on a tablet', () => {
		mockWidth(800);
		renderRows();
		expect(cellWidths()).toEqual(['50%', '50%', '50%']);
	});

	it('puts three rows side by side on desktop', () => {
		mockWidth(1440);
		renderRows();
		expect(cellWidths()).toHaveLength(3);
		expect(cellWidths()[0]).toMatch(/^33\.3/);
	});
});
