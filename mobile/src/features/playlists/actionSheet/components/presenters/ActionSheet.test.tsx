import React from 'react';
import { Modal, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ActionSheet } from './ActionSheet';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(),
}));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

jest.mock('react-native-safe-area-context', () => ({
	useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const mockWidth = (width: number) =>
	jest.mocked(useWindowDimensions).mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });

const anchor = { x: 1300, y: 20, width: 36, height: 36 };

const renderSheet = (props: Partial<React.ComponentProps<typeof ActionSheet>> = {}) => {
	const onClose = jest.fn();
	render(
		<ActionSheet visible title="Playlist" onClose={onClose} {...props}>
			<Text>Modifier</Text>
		</ActionSheet>
	);
	return onClose;
};

describe('ActionSheet', () => {
	it('drops down from its button on desktop, and its backdrop closes it', () => {
		mockWidth(1440);
		const onClose = renderSheet({ anchor });
		const menu = screen.UNSAFE_getByProps({ accessibilityRole: 'menu' });
		expect(StyleSheet.flatten(menu.props.style)).toMatchObject({ top: 60, left: 1016 });
		expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('none');
		fireEvent.press(screen.getByLabelText('Fermer'));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('is a centred dialog on desktop when no button opened it', () => {
		mockWidth(1440);
		renderSheet({ anchor: null });
		expect(screen.UNSAFE_queryAllByProps({ accessibilityRole: 'menu' })).toHaveLength(0);
		expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('fade');
	});

	it('stays a bottom sheet on the phone', () => {
		mockWidth(390);
		renderSheet({ anchor });
		expect(screen.UNSAFE_queryAllByProps({ accessibilityRole: 'menu' })).toHaveLength(0);
		expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('slide');
		expect(screen.getByText('Modifier')).toBeTruthy();
	});
});
