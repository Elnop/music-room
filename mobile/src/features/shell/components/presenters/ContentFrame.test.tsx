import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import { useContentWidth } from '@/shared/theme/hooks/useContentWidth';
import { NOW_PLAYING_PANEL_WIDTH, SIDEBAR_WIDTH } from '@/shared/theme/lib/layout';
import { ContentFrame } from './ContentFrame';
import { Text } from '@/shared/theme/components/Text';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(),
}));

jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme: theme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme }) };
});

const mockWidth = (width: number) =>
	jest.mocked(useWindowDimensions).mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });

function WidthProbe() {
	return <Text>{useContentWidth()}</Text>;
}

function ColumnProbe() {
	return <Text>{JSON.stringify(useContentColumn())}</Text>;
}

describe('ContentFrame', () => {
	it('adds no view on the phone, and the content keeps the window width', () => {
		mockWidth(375);
		render(
			<ContentFrame width="content" besideSidebar>
				<WidthProbe />
			</ContentFrame>
		);
		expect(screen.getByText('375')).toBeTruthy();
		expect(screen.UNSAFE_queryAllByType(View)).toHaveLength(0);
	});

	it('caps the content at its maximum width on desktop', () => {
		mockWidth(1440);
		render(
			<ContentFrame width="content" besideSidebar>
				<WidthProbe />
			</ContentFrame>
		);
		expect(screen.getByText('960')).toBeTruthy();
		const inner = screen.UNSAFE_getAllByType(View)[1];
		expect(StyleSheet.flatten(inner.props.style)).toMatchObject({ maxWidth: 960, width: '100%' });
	});

	it('leaves the sidebar its share of a tablet window', () => {
		mockWidth(800);
		render(
			<ContentFrame width="wide" besideSidebar>
				<WidthProbe />
			</ContentFrame>
		);
		expect(screen.getByText(String(800 - SIDEBAR_WIDTH.tablet))).toBeTruthy();
	});

	it('uses the whole window beside no sidebar', () => {
		mockWidth(800);
		render(
			<ContentFrame width="wide">
				<WidthProbe />
			</ContentFrame>
		);
		expect(screen.getByText('800')).toBeTruthy();
	});

	it('leaves the open now playing panel its share of a desktop window', () => {
		mockWidth(1440);
		render(
			<ContentFrame width="wide" besideSidebar panelOpen>
				<WidthProbe />
			</ContentFrame>
		);
		expect(
			screen.getByText(String(1440 - SIDEBAR_WIDTH.desktop - NOW_PLAYING_PANEL_WIDTH))
		).toBeTruthy();
	});

	it('lets a screen scroll across the whole area and hands it the column to centre its content in', () => {
		mockWidth(1440);
		render(
			<ContentFrame width="content" besideSidebar scrollsAtEdge>
				<ColumnProbe />
			</ContentFrame>
		);
		const inner = screen.UNSAFE_getAllByType(View)[1];
		expect(StyleSheet.flatten(inner.props.style).maxWidth).toBeUndefined();
		expect(
			screen.getByText(JSON.stringify({ width: '100%', maxWidth: 960, alignSelf: 'center' }))
		).toBeTruthy();
	});

	it('gives no column to a screen it caps itself', () => {
		mockWidth(1440);
		render(
			<ContentFrame width="content" besideSidebar>
				<ColumnProbe />
			</ContentFrame>
		);
		expect(screen.getByText('null')).toBeTruthy();
	});
});
