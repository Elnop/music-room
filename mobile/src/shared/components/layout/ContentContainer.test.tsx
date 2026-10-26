import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { useContentWidth } from '@/shared/hooks/useContentWidth';
import { SIDEBAR_WIDTH } from '@/shared/constants/layout';
import { ContentContainer } from './ContentContainer';
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

function WidthProbe() {
	return <Text>{useContentWidth()}</Text>;
}

describe('ContentContainer', () => {
	it('adds no view on the phone, and the content keeps the window width', () => {
		mockWidth(375);
		render(
			<ContentContainer width="content" besideSidebar>
				<WidthProbe />
			</ContentContainer>
		);
		expect(screen.getByText('375')).toBeTruthy();
		expect(screen.UNSAFE_queryAllByType(View)).toHaveLength(0);
	});

	it('caps the content at its maximum width on desktop', () => {
		mockWidth(1440);
		render(
			<ContentContainer width="content" besideSidebar>
				<WidthProbe />
			</ContentContainer>
		);
		expect(screen.getByText('960')).toBeTruthy();
		const inner = screen.UNSAFE_getAllByType(View)[1];
		expect(StyleSheet.flatten(inner.props.style)).toMatchObject({ maxWidth: 960, width: '100%' });
	});

	it('leaves the sidebar its share of a tablet window', () => {
		mockWidth(800);
		render(
			<ContentContainer width="wide" besideSidebar>
				<WidthProbe />
			</ContentContainer>
		);
		expect(screen.getByText(String(800 - SIDEBAR_WIDTH.tablet))).toBeTruthy();
	});

	it('uses the whole window beside no sidebar', () => {
		mockWidth(800);
		render(
			<ContentContainer width="wide">
				<WidthProbe />
			</ContentContainer>
		);
		expect(screen.getByText('800')).toBeTruthy();
	});
});
