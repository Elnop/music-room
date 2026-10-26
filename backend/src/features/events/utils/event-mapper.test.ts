import { describe, expect, it } from 'vitest';
import { toEvent } from '@/features/events/utils/event-mapper.js';
import type { EventRowWithRelations } from '@/features/events/events.types.js';

const OWNER = '11111111-1111-4111-8111-111111111111';

function row(playlist: EventRowWithRelations['playlist']): EventRowWithRelations {
	return {
		id: '22222222-2222-4222-8222-222222222222',
		owner_id: OWNER,
		name: 'Rooftop',
		description: null,
		address: '1 rue de Paris',
		latitude: 48.9,
		longitude: 2.3,
		access_info: 'Ring twice',
		genres: ['rock', 'not-a-genre'],
		starts_at: '2026-11-06T20:00:00+00:00',
		ends_at: '2026-11-07T02:00:00+00:00',
		playlist_id: playlist?.id ?? null,
		beacon_minor: 42,
		created_at: '2026-10-01T10:00:00+00:00',
		updated_at: '2026-10-01T10:00:00+00:00',
		owner: { id: OWNER, username: 'dj', display_name: null, avatar_url: null },
		playlist,
	};
}

const playlist = {
	id: '33333333-3333-4333-8333-333333333333',
	name: 'Warm-up',
	cover_url: null,
	visibility: 'public',
	owner_id: OWNER,
};

describe('toEvent', () => {
	it('maps the row and drops unknown genres', () => {
		const event = toEvent(row(playlist));
		expect(event).toMatchObject({
			accessInfo: 'Ring twice',
			genres: ['rock'],
			beaconMinor: 42,
			startsAt: '2026-11-06T20:00:00.000Z',
			organizer: { id: OWNER, username: 'dj' },
			playlist: { id: playlist.id, name: 'Warm-up' },
		});
		expect(event.description).toBeUndefined();
	});

	it('hides a linked playlist that is no longer public', () => {
		expect(toEvent(row({ ...playlist, visibility: 'private' })).playlist).toBeNull();
	});

	it("hides a linked playlist that is not the organiser's", () => {
		const other = '44444444-4444-4444-8444-444444444444';
		expect(toEvent(row({ ...playlist, owner_id: other })).playlist).toBeNull();
	});
});
