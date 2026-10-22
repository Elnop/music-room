import { estimatePositionMs } from './remotePosition';

const NOW = Date.parse('2026-10-15T12:00:00Z');

describe('estimatePositionMs', () => {
	const sent = { positionMs: 10_000, updatedAt: new Date(NOW - 5000).toISOString() };

	it('adds the time elapsed since the status while playing', () => {
		expect(estimatePositionMs({ ...sent, isPlaying: true }, NOW, null)).toBe(15_000);
	});

	it('keeps the sent position while paused, and stops at the duration', () => {
		expect(estimatePositionMs({ ...sent, isPlaying: false }, NOW, null)).toBe(10_000);
		expect(estimatePositionMs({ ...sent, isPlaying: true }, NOW, 12_000)).toBe(12_000);
	});
});
