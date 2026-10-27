import React from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SwipeableTrackItem } from './SwipeableTrackItem';
import type { Track } from '@/types/track.types';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
	__esModule: true,
	default: jest.fn(),
}));

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

const mockWidth = (width: number) =>
	jest.mocked(useWindowDimensions).mockReturnValue({ width, height: 900, scale: 1, fontScale: 1 });

const track = { id: 't1', title: 'Song', artist: 'Artist', durationMs: 125000 } as Track;

const renderRow = (props: Partial<React.ComponentProps<typeof SwipeableTrackItem>> = {}) =>
	render(
		<SwipeableTrackItem
			track={track}
			onDelete={jest.fn()}
			position={3}
			onPress={jest.fn()}
			onShowActions={jest.fn()}
			onDragStart={jest.fn()}
			{...props}
		/>
	);

const handleOpacity = () =>
	StyleSheet.flatten(screen.getByLabelText('Réordonner').props.style).opacity;

describe('SwipeableTrackItem as a table row', () => {
	it('keeps the phone row on the phone, even with a position', async () => {
		mockWidth(390);
		renderRow();
		await act(async () => {});
		expect(screen.getByLabelText('Song, Artist')).toBeTruthy();
		expect(screen.queryByText('3')).toBeNull();
	});

	it('lays the number, title, artist and duration out in columns on desktop', async () => {
		mockWidth(1440);
		renderRow();
		await act(async () => {});
		expect(screen.getByLabelText('3. Song, Artist')).toBeTruthy();
		expect(screen.getByText('3')).toBeTruthy();
		expect(screen.getByText('Artist')).toBeTruthy();
		expect(screen.getByText('2:05')).toBeTruthy();
	});

	it('shows play and the drag handle while the pointer is over the row', async () => {
		mockWidth(1440);
		renderRow();
		await act(async () => {});
		expect(handleOpacity()).toBe(0.3);

		const row = screen.getByLabelText('3. Song, Artist').parent!.parent!;
		fireEvent(row, 'pointerEnter');
		expect(screen.queryByText('3')).toBeNull();
		expect(handleOpacity()).toBeUndefined();

		fireEvent(row, 'pointerLeave');
		expect(screen.getByText('3')).toBeTruthy();
	});

	it('plays on a tap and still starts a drag from the handle', async () => {
		mockWidth(1440);
		const onPress = jest.fn();
		const onDragStart = jest.fn();
		renderRow({ onPress, onDragStart });
		await act(async () => {});
		fireEvent.press(screen.getByText('Song'));
		fireEvent(screen.getByLabelText('Réordonner'), 'pressIn');
		expect(onPress).toHaveBeenCalledTimes(1);
		expect(onDragStart).toHaveBeenCalledTimes(1);
	});

	it('has no drag handle for a viewer', async () => {
		mockWidth(1440);
		renderRow({ disabled: true });
		await act(async () => {});
		expect(screen.queryByLabelText('Réordonner')).toBeNull();
	});
});
