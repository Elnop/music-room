import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { SwipeableTrackItem } from '@/components/common/SwipeableTrackItem';
import type { Track } from '@/types/track.types';

jest.mock('@/contexts/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@themes/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

const track = { id: 't1', title: 'Song', artist: 'Artist' } as Track;
const onDelete = jest.fn().mockResolvedValue(undefined);

describe('SwipeableTrackItem', () => {
	it('shows no drag handle without onDragStart', async () => {
		render(<SwipeableTrackItem track={track} onDelete={onDelete} />);
		// Ionicons loads its font asynchronously and re-renders once it is ready.
		await act(async () => {});
		expect(screen.queryByLabelText('Reorder track')).toBeNull();
	});

	it('hides the drag handle when disabled', async () => {
		render(
			<SwipeableTrackItem track={track} onDelete={onDelete} onDragStart={jest.fn()} disabled />
		);
		// Ionicons loads its font asynchronously and re-renders once it is ready.
		await act(async () => {});
		expect(screen.queryByLabelText('Reorder track')).toBeNull();
	});

	it('starts the drag when the handle is pressed', async () => {
		const onDragStart = jest.fn();
		render(<SwipeableTrackItem track={track} onDelete={onDelete} onDragStart={onDragStart} />);
		// Ionicons loads its font asynchronously and re-renders once it is ready.
		await act(async () => {});
		fireEvent(screen.getByLabelText('Reorder track'), 'pressIn');
		expect(onDragStart).toHaveBeenCalledTimes(1);
	});
});
