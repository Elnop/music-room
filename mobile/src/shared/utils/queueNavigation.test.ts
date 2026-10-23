import {
	RESTART_THRESHOLD_S,
	currentItem,
	nextItem,
	previousAction,
	selectHasNext,
	selectHasPrevious,
} from './queueNavigation';
import type { QueueItem } from '@/types/queue.types';

const mockItem = (id: string): QueueItem => ({
	id,
	rank: id,
	sourcePlaylistId: null,
	blockId: null,
	blockDetached: false,
	track: {
		title: id,
		artist: 'Artist',
		durationMs: 180000,
		album: null,
		albumArt: null,
		trackUri: 'uri',
	},
});

describe('queueNavigation', () => {
	it('defines RESTART_THRESHOLD_S as 3', () => {
		expect(RESTART_THRESHOLD_S).toBe(3);
	});

	it('determines previousAction correctly', () => {
		expect(previousAction(5, true)).toBe('restart');
		expect(previousAction(2, false)).toBe('restart');
		expect(previousAction(2, true)).toBe('previous');
	});

	it('computes currentItem, nextItem, selectHasNext, selectHasPrevious', () => {
		const items = [mockItem('1'), mockItem('2'), mockItem('3')];
		const state = { currentItemId: '2', items };

		expect(currentItem(state)?.id).toBe('2');
		expect(nextItem(state)?.id).toBe('3');
		expect(selectHasNext(state)).toBe(true);
		expect(selectHasPrevious(state)).toBe(true);

		const lastState = { currentItemId: '3', items };
		expect(selectHasNext(lastState)).toBe(false);
		expect(selectHasPrevious(lastState)).toBe(true);

		const firstState = { currentItemId: '1', items };
		expect(selectHasNext(firstState)).toBe(true);
		expect(selectHasPrevious(firstState)).toBe(false);

		const emptyState = { currentItemId: null, items: [] };
		expect(currentItem(emptyState)).toBeUndefined();
		expect(nextItem(emptyState)).toBeUndefined();
		expect(selectHasNext(emptyState)).toBe(false);
		expect(selectHasPrevious(emptyState)).toBe(false);
	});
});
