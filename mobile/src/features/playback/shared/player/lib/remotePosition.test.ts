import { estimatePositionMs } from './remotePosition';

describe('estimatePositionMs', () => {
	const NOW = 1_700_000_000_000;
	const sent = {
		positionMs: 10_000,
		updatedAt: new Date(NOW - 5000).toISOString(),
	};

	it('adds elapsed time while playing, clamped to duration', () => {
		expect(estimatePositionMs({ ...sent, isPlaying: true }, NOW, null)).toBe(15_000);
		expect(estimatePositionMs({ ...sent, isPlaying: false }, NOW, null)).toBe(10_000);
		expect(estimatePositionMs({ ...sent, isPlaying: true }, NOW, 12_000)).toBe(12_000);
	});
});
