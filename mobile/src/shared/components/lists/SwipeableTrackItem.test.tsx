import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { SwipeableTrackItem } from './SwipeableTrackItem';
import type { Track } from '@/types/track.types';

jest.mock('@/shared/theme/ThemeContext', () => {
	const { originalTheme } = jest.requireActual('@/shared/theme/original.theme');
	return { useTheme: () => ({ theme: originalTheme }) };
});

const track = { id: 't1', title: 'Song', artist: 'Artist' } as Track;
const onDelete = jest.fn().mockResolvedValue(undefined);

describe('SwipeableTrackItem', () => {
	it('shows no drag handle without onDragStart', async () => {
		render(<SwipeableTrackItem track={track} onDelete={onDelete} />);
		// Ionicons loads its font asynchronously and re-renders once it is ready.
		await act(async () => {});
		expect(screen.queryByLabelText('Réordonner')).toBeNull();
	});

	it('hides the drag handle when disabled', async () => {
		render(
			<SwipeableTrackItem track={track} onDelete={onDelete} onDragStart={jest.fn()} disabled />
		);
		// Ionicons loads its font asynchronously and re-renders once it is ready.
		await act(async () => {});
		expect(screen.queryByLabelText('Réordonner')).toBeNull();
	});

	it('opens the quick actions on a long press or the ⋯ button, even for a viewer', async () => {
		const onShowActions = jest.fn();
		render(
			<SwipeableTrackItem
				track={track}
				onDelete={onDelete}
				onShowActions={onShowActions}
				disabled
			/>
		);
		await act(async () => {});
		fireEvent(screen.getByText('Song'), 'longPress');
		fireEvent.press(screen.getByLabelText('Actions'));
		expect(onShowActions).toHaveBeenCalledTimes(2);
	});

	it('names the row after the track for a screen reader', async () => {
		render(<SwipeableTrackItem track={track} onDelete={onDelete} onShowActions={jest.fn()} />);
		await act(async () => {});
		expect(screen.getByLabelText('Song, Artist').props.accessibilityHint).toBe(
			'Appui long pour les actions du titre'
		);
	});

	it('shows no ⋯ button without onShowActions', async () => {
		render(<SwipeableTrackItem track={track} onDelete={onDelete} />);
		await act(async () => {});
		expect(screen.queryByLabelText('Actions')).toBeNull();
	});

	it('starts the drag when the handle is pressed', async () => {
		const onDragStart = jest.fn();
		render(<SwipeableTrackItem track={track} onDelete={onDelete} onDragStart={onDragStart} />);
		// Ionicons loads its font asynchronously and re-renders once it is ready.
		await act(async () => {});
		fireEvent(screen.getByLabelText('Réordonner'), 'pressIn');
		expect(onDragStart).toHaveBeenCalledTimes(1);
	});

	it('offers the queue swipe but no delete to a viewer who cannot edit', async () => {
		render(
			<SwipeableTrackItem track={track} onDelete={onDelete} onAddToQueue={jest.fn()} disabled />
		);
		await act(async () => {});
		const swipeable = screen.UNSAFE_getByType(Swipeable);
		expect(swipeable.props.enabled).toBe(true);
		expect(swipeable.props.renderRightActions).toBeUndefined();
		expect(screen.getByLabelText("Ajouter à la file d'attente")).toBeTruthy();
		expect(screen.queryByText('Supprimer')).toBeNull();
	});

	it('keeps the delete action for an editor', async () => {
		render(<SwipeableTrackItem track={track} onDelete={onDelete} onAddToQueue={jest.fn()} />);
		await act(async () => {});
		expect(screen.getByLabelText("Ajouter à la file d'attente")).toBeTruthy();
		fireEvent.press(screen.getByText('Supprimer'));
		expect(onDelete).toHaveBeenCalledWith('t1');
	});

	it('adds to the queue once the right swipe opens, then closes the row', async () => {
		const onAddToQueue = jest.fn();
		render(<SwipeableTrackItem track={track} onDelete={onDelete} onAddToQueue={onAddToQueue} />);
		await act(async () => {});
		const swipeable = screen.UNSAFE_getByType(Swipeable);
		const close = jest.fn();

		act(() => swipeable.props.onSwipeableOpen('right', { close }));
		expect(onAddToQueue).not.toHaveBeenCalled();

		act(() => swipeable.props.onSwipeableOpen('left', { close }));
		expect(onAddToQueue).toHaveBeenCalledTimes(1);
		expect(close).toHaveBeenCalledTimes(1);
	});

	it('disables every swipe for a viewer without a queue action', async () => {
		render(<SwipeableTrackItem track={track} onDelete={onDelete} disabled />);
		await act(async () => {});
		expect(screen.UNSAFE_getByType(Swipeable).props.enabled).toBe(false);
	});

	it('highlights the track playing now with a speaker icon (#307)', async () => {
		render(<SwipeableTrackItem track={track} onDelete={onDelete} isCurrent />);
		await act(async () => {});
		expect(screen.getByLabelText('Song, Artist').props.accessibilityState).toEqual({
			selected: true,
		});
		expect(screen.getByLabelText('En cours de lecture')).toBeTruthy();
	});

	it('shows no speaker icon on another track', async () => {
		render(<SwipeableTrackItem track={track} onDelete={onDelete} />);
		await act(async () => {});
		expect(screen.queryByLabelText('En cours de lecture')).toBeNull();
	});
});
