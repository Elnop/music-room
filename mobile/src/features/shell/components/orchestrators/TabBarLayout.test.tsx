import React from 'react';
import { useWindowDimensions } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TabBarLayout } from '@/features/shell/components/orchestrators/TabBarLayout';
import { Text } from '@/shared/theme/components/Text';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/bottom-tabs', () => {
	const { Text: MockText } = jest.requireActual('@/shared/theme/components/Text');
	return { BottomTabBar: () => <MockText>tab-bar</MockText> };
});

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/shared/theme/components/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/lib/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('@/shared/backend/lib/authSession', () => ({
	useSession: (selector: (s: { user: object }) => unknown) =>
		selector({ user: { id: 'me', username: 'bob', displayName: 'Bob' } }),
}));

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(() => ({ width: 375, height: 800, scale: 1, fontScale: 1 })),
}));

function propsOn(tab: string) {
	return {
		navigation: { navigate: mockNavigate },
		state: { index: 0, routes: [{ key: tab, name: tab }] },
	} as unknown as BottomTabBarProps;
}

const props = propsOn('HomeTab');

function setWidth(width: number) {
	return jest
		.mocked(useWindowDimensions)
		.mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });
}

function texts() {
	return screen.UNSAFE_getAllByType(Text).map(node => node.props.children);
}

describe('TabBarLayout', () => {
	it('stacks the mini-player right above the tab bar, in the tab bar slot', () => {
		setWidth(375);
		render(<TabBarLayout {...props} miniPlayer={<Text>mini-player</Text>} />);
		expect(texts()).toEqual(['mini-player', 'tab-bar']);
		expect(screen.queryByLabelText('Zumik')).toBeNull();
	});

	it('frames the tablet rail with the wordmark, without the mini-player nor the account', () => {
		setWidth(820);
		render(<TabBarLayout {...props} miniPlayer={<Text>mini-player</Text>} />);
		expect(texts()).toEqual(['ZUMIK', 'tab-bar']);
		expect(screen.getByLabelText('Zumik')).toBeTruthy();
	});

	it('puts the logo above the desktop side bar and the user below it, a link to the profile', () => {
		setWidth(1440);
		render(<TabBarLayout {...props} miniPlayer={<Text>mini-player</Text>} />);
		expect(screen.getByLabelText('Zumik')).toBeTruthy();
		expect(screen.queryByText('mini-player')).toBeNull();

		fireEvent.press(screen.getByLabelText('Profil, Bob'));
		expect(mockNavigate).toHaveBeenCalledWith('ProfileTab');
	});

	it('shows the account as the active entry while the profile tab is open', () => {
		setWidth(1440);
		const { rerender } = render(<TabBarLayout {...props} miniPlayer={<Text>mini-player</Text>} />);
		expect(screen.getByLabelText('Profil, Bob')).toHaveProp('accessibilityState', {
			selected: false,
		});

		rerender(<TabBarLayout {...propsOn('ProfileTab')} miniPlayer={<Text>mini-player</Text>} />);
		expect(screen.getByLabelText('Profil, Bob')).toHaveProp('accessibilityState', {
			selected: true,
		});
	});
});
