import { musicEvent } from '@/test/eventFixtures';
import { nearbyByGps } from './nearbyEvents';

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
