import { musicEvent } from '@/test/eventFixtures';
import { mergeNearby, nearbyByGps } from './nearbyEvents';

const HOUR = 3_600_000;
const here = { latitude: 48.8966, longitude: 2.3185 };
const at = (offset: number) => new Date(Date.now() + offset).toISOString();

describe('nearbyByGps', () => {
	it('keeps ongoing events within the radius, nearest first', () => {
		const near = musicEvent({ id: 'near', latitude: 48.8976 });
		const nearest = musicEvent({ id: 'nearest' });
		const far = musicEvent({ id: 'far', latitude: 48.91 });
		const result = nearbyByGps([near, far, nearest], here);
		expect(result.map(item => item.event.id)).toEqual(['nearest', 'near']);
		expect(result[1].distance).toBeCloseTo(111, -1);
	});

	it('leaves out upcoming and ended events', () => {
		const upcoming = musicEvent({ id: 'upcoming', startsAt: at(HOUR), endsAt: at(2 * HOUR) });
		const ended = musicEvent({ id: 'ended', startsAt: at(-2 * HOUR), endsAt: at(-HOUR) });
		expect(nearbyByGps([upcoming, ended], here)).toEqual([]);
	});

	it('drops an event once it ends', () => {
		const event = musicEvent();
		const afterEnd = Date.parse(event.endsAt) + 1;
		expect(nearbyByGps([event], here, afterEnd)).toEqual([]);
	});
});

describe('mergeNearby', () => {
	const sighting = (rssi: number) => ({ rssi, measuredPower: -59, lastSeen: Date.now() });

	it('shows an event heard by beacon as "Tout près", once, before the GPS ones', () => {
		const heard = musicEvent({ id: 'heard', beaconMinor: 7 });
		const located = musicEvent({ id: 'located', beaconMinor: 8, latitude: 48.8976 });
		const items = mergeNearby([located, heard], new Map([[7, sighting(-60)]]), here);
		expect(items).toEqual([
			{ event: heard, proximity: 'Tout près' },
			{ event: located, proximity: '110 m' },
		]);
	});

	it('works without any position, from the beacon alone', () => {
		const far = musicEvent({ beaconMinor: 7, latitude: 45, longitude: 4 });
		expect(mergeNearby([far], new Map([[7, sighting(-70)]]), null)).toEqual([
			{ event: far, proximity: 'Tout près' },
		]);
	});

	it('orders beacons by signal and ignores an ended event still heard', () => {
		const near = musicEvent({ id: 'near', beaconMinor: 1 });
		const farther = musicEvent({ id: 'farther', beaconMinor: 2 });
		const ended = musicEvent({
			id: 'ended',
			beaconMinor: 3,
			startsAt: at(-2 * HOUR),
			endsAt: at(-HOUR),
		});
		const heard = new Map([
			[1, sighting(-55)],
			[2, sighting(-80)],
			[3, sighting(-50)],
		]);
		expect(mergeNearby([farther, ended, near], heard, null).map(item => item.event.id)).toEqual([
			'near',
			'farther',
		]);
	});
});
