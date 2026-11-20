import { radarSpot } from './radarBlips';

describe('radarSpot', () => {
	it('keeps an event at the same spot from one render to the next', () => {
		expect(radarSpot('event-a', 0, 3)).toEqual(radarSpot('event-a', 0, 3));
	});

	it('puts a nearer event closer to the user at the bottom centre', () => {
		const distanceFromUser = ({ left, top }: { left: number; top: number }) =>
			Math.hypot(left - 50, 100 - top);

		expect(distanceFromUser(radarSpot('event-a', 0, 3))).toBeLessThan(
			distanceFromUser(radarSpot('event-a', 2, 3))
		);
	});

	it('stays inside the radar box', () => {
		['a', 'b', 'party', 'concert-42'].forEach((id, rank) => {
			const { left, top } = radarSpot(id, rank, 4);
			expect(left).toBeGreaterThanOrEqual(0);
			expect(left).toBeLessThanOrEqual(100);
			expect(top).toBeGreaterThanOrEqual(0);
			expect(top).toBeLessThanOrEqual(100);
		});
	});
});
