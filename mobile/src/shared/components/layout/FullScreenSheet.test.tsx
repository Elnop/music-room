import React from 'react';
import { Modal, Text, useWindowDimensions } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FullScreenSheet } from './FullScreenSheet';

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

const renderSheet = (onClose = jest.fn()) => {
	render(
		<FullScreenSheet visible onClose={onClose}>
			<Text>queue</Text>
		</FullScreenSheet>
	);
	return onClose;
};

describe('FullScreenSheet', () => {
	it('slides the sheet over the whole phone screen', () => {
		mockWidth(375);
		renderSheet();
		expect(screen.getByText('queue')).toBeTruthy();
		expect(screen.queryByLabelText('Fermer')).toBeNull();
		expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('slide');
	});

	it('centres a dialog on desktop, which its backdrop closes', () => {
		mockWidth(1440);
		const onClose = renderSheet();
		expect(screen.getByText('queue')).toBeTruthy();
		expect(screen.UNSAFE_getByType(Modal).props.animationType).toBe('fade');
		fireEvent.press(screen.getByLabelText('Fermer'));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('closes on the platform back request (Escape in a browser)', () => {
		mockWidth(1440);
		const onClose = renderSheet();
		screen.UNSAFE_getByType(Modal).props.onRequestClose();
		expect(onClose).toHaveBeenCalledTimes(1);
	});
});
