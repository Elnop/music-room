import { estimateDistance, pruneSightings, recordSighting, smoothRssi } from './beaconDistance';

describe('estimateDistance', () => {
	it('is one metre at the measured power and grows with the attenuation', () => {
		expect(estimateDistance(-59, -59)).toBeCloseTo(1);
		expect(estimateDistance(-84, -59)).toBeCloseTo(10);
		expect(estimateDistance(-50, -59)).toBeLessThan(1);
	});
});

describe('smoothRssi', () => {
	it('takes the first reading, then moves 30 % towards each new one', () => {
		expect(smoothRssi(undefined, -70)).toBe(-70);
		expect(smoothRssi(-70, -60)).toBeCloseTo(-67);
	});
});

describe('sightings', () => {
	it('smooths the RSSI per beacon and drops a silent one', () => {
		let sightings = recordSighting(new Map(), 42, { rssi: -70, measuredPower: -59 }, 0);
		sightings = recordSighting(sightings, 42, { rssi: -60, measuredPower: -59 }, 1_000);
		expect(sightings.get(42)).toEqual({ rssi: -67, measuredPower: -59, lastSeen: 1_000 });

		expect(pruneSightings(sightings, 8_000, 8_000).has(42)).toBe(true);
		expect(pruneSightings(sightings, 9_001, 8_000).has(42)).toBe(false);
	});
});
