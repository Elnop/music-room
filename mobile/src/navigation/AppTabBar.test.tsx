import React from 'react';
import { Text } from 'react-native';
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

describe('AppTabBar', () => {
	it('stacks the mini-player right above the tab bar, in the tab bar slot', () => {
		render(<AppTabBar {...({} as BottomTabBarProps)} />);
		const texts = screen.UNSAFE_getAllByType(Text).map(node => node.props.children);
		expect(texts).toEqual(['mini-player', 'tab-bar']);
	});
});
