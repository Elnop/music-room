import { musicEvent } from '@/test/eventFixtures';
import { removeEvent, upsertEvent } from './eventCache';

const HOUR = 3_600_000;
const at = (offset: number) => new Date(Date.now() + offset).toISOString();

describe('upsertEvent', () => {
	it('adds an event in start order and replaces an existing one', () => {
		const late = musicEvent({ id: 'late', startsAt: at(5 * HOUR), endsAt: at(6 * HOUR) });
		const early = musicEvent({ id: 'early' });
		const list = upsertEvent([late], early);
		expect(list.map(event => event.id)).toEqual(['early', 'late']);

		const renamed = upsertEvent(list, { ...early, name: 'Renamed' });
		expect(renamed).toHaveLength(2);
		expect(renamed[0].name).toBe('Renamed');
	});

	it('drops an event that is over', () => {
		const ended = musicEvent({ startsAt: at(-3 * HOUR), endsAt: at(-HOUR) });
		expect(upsertEvent([musicEvent()], ended)).toEqual([]);
	});
});

describe('removeEvent', () => {
	it('removes the event by id', () => {
		expect(removeEvent([musicEvent()], 'e1')).toEqual([]);
	});
});
