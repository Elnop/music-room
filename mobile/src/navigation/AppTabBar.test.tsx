import React from 'react';
import { Text, useWindowDimensions } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AppTabBar } from './AppTabBar';

const mockNavigate = jest.fn();

jest.mock('@/features/player/miniPlayer/components/orchestrators/MiniPlayer', () => {
	const { Text: MockText } = jest.requireActual('react-native');
	return { MiniPlayer: () => <MockText>mini-player</MockText> };
});

jest.mock('@react-navigation/bottom-tabs', () => {
	const { Text: MockText } = jest.requireActual('react-native');
	return { BottomTabBar: () => <MockText>tab-bar</MockText> };
});

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/services/authSession', () => ({
	useSession: (selector: (s: { user: object }) => unknown) =>
		selector({ user: { id: 'me', username: 'bob', displayName: 'Bob' } }),
}));

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(() => ({ width: 375, height: 800, scale: 1, fontScale: 1 })),
}));

const props = { navigation: { navigate: mockNavigate } } as unknown as BottomTabBarProps;

const setWidth = (width: number) =>
	jest.mocked(useWindowDimensions).mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });

const texts = () => screen.UNSAFE_getAllByType(Text).map(node => node.props.children);

describe('AppTabBar', () => {
	it('stacks the mini-player right above the tab bar, in the tab bar slot', () => {
		setWidth(375);
		render(<AppTabBar {...props} />);
		expect(texts()).toEqual(['mini-player', 'tab-bar']);
		expect(screen.queryByLabelText('Zumik')).toBeNull();
	});

	it('frames the tablet rail with the app icon, without the mini-player nor the account', () => {
		setWidth(820);
		render(<AppTabBar {...props} />);
		expect(texts()).toEqual(['tab-bar']);
		expect(screen.getByLabelText('Zumik')).toBeTruthy();
	});

	it('puts the logo above the desktop side bar and the user below it, a link to the profile', () => {
		setWidth(1440);
		render(<AppTabBar {...props} />);
		expect(screen.getByLabelText('Zumik')).toBeTruthy();
		expect(screen.queryByText('mini-player')).toBeNull();

		fireEvent.press(screen.getByLabelText('Profil, Bob'));
		expect(mockNavigate).toHaveBeenCalledWith('ProfileTab');
	});
});
