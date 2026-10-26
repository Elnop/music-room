import { distanceMeters, formatDistance } from './geo';

describe('distanceMeters', () => {
	it('is zero for the same point', () => {
		expect(
			distanceMeters({ latitude: 48.9, longitude: 2.3 }, { latitude: 48.9, longitude: 2.3 })
		).toBe(0);
	});

	it('gives about 111 m per thousandth of a degree of latitude', () => {
		const d = distanceMeters(
			{ latitude: 48.9, longitude: 2.3 },
			{ latitude: 48.901, longitude: 2.3 }
		);
		expect(d).toBeGreaterThan(110);
		expect(d).toBeLessThan(112);
	});

	it('matches the known Paris – Lyon distance', () => {
		const paris = { latitude: 48.8566, longitude: 2.3522 };
		const lyon = { latitude: 45.764, longitude: 4.8357 };
		expect(distanceMeters(paris, lyon) / 1000).toBeCloseTo(392, -1);
	});
});

describe('formatDistance', () => {
	it('rounds to ten metres below a kilometre, then shows kilometres', () => {
		expect(formatDistance(3)).toBe('10 m');
		expect(formatDistance(124)).toBe('120 m');
		expect(formatDistance(1234)).toBe('1,2 km');
	});
});
