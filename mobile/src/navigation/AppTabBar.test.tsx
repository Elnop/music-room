import React from 'react';
import { Text, useWindowDimensions } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppTabBar } from './AppTabBar';

jest.mock('@/features/player/miniPlayer/components/orchestrators/MiniPlayer', () => {
	const { Text: MockText } = jest.requireActual('react-native');
	return { MiniPlayer: () => <MockText>mini-player</MockText> };
});

jest.mock('@react-navigation/bottom-tabs', () => {
	const { Text: MockText } = jest.requireActual('react-native');
	return { BottomTabBar: () => <MockText>tab-bar</MockText> };
});

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(() => ({ width: 375, height: 800, scale: 1, fontScale: 1 })),
}));

describe('AppTabBar', () => {
	it('stacks the mini-player right above the tab bar, in the tab bar slot', () => {
		render(<AppTabBar {...({} as BottomTabBarProps)} />);
		const texts = screen.UNSAFE_getAllByType(Text).map(node => node.props.children);
		expect(texts).toEqual(['mini-player', 'tab-bar']);
	});

	it('leaves the mini-player out of the side bar of wide screens', () => {
		jest
			.mocked(useWindowDimensions)
			.mockReturnValue({ width: 1440, height: 900, scale: 1, fontScale: 1 });
		render(<AppTabBar {...({} as BottomTabBarProps)} />);
		const texts = screen.UNSAFE_getAllByType(Text).map(node => node.props.children);
		expect(texts).toEqual(['tab-bar']);
	});
});
