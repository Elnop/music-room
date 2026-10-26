import type { MusicEvent } from '@/features/events/types';

const HOUR = 3_600_000;

/** An event that started an hour ago and ends in two, organised by `bob`. */
export function musicEvent(overrides: Partial<MusicEvent> = {}): MusicEvent {
	const now = Date.now();
	return {
		id: 'e1',
		name: 'Rooftop',
		address: '96 bd Bessières, Paris',
		latitude: 48.8966,
		longitude: 2.3185,
		accessInfo: 'Bâtiment C, 7e étage',
		genres: ['electronic', 'rnb'],
		startsAt: new Date(now - HOUR).toISOString(),
		endsAt: new Date(now + 2 * HOUR).toISOString(),
		beaconMinor: 42,
		organizer: { id: 'bob', username: 'bob' },
		playlist: null,
		createdAt: new Date(now - 2 * HOUR).toISOString(),
		updatedAt: new Date(now - 2 * HOUR).toISOString(),
		...overrides,
	};
}
