import { NEARBY_RADIUS_M } from '@/features/events/features/nearby/configs/nearbyConfig';
import { isOngoing } from '@/features/events/shared/event-dates/eventDates';
import { distanceMeters } from '@/features/events/features/nearby/lib/geo';
import type { Coordinates, MusicEvent } from '@/features/events/eventTypes';

type NearbyEvent = {
	event: MusicEvent;
	distance: number;
};

export function nearbyByGps(
	events: MusicEvent[],
	position: Coordinates,
	now = Date.now(),
	radius = NEARBY_RADIUS_M,
): NearbyEvent[] {
	return events
		.filter((event) => isOngoing(event, now))
		.map((event) => ({ event, distance: distanceMeters(position, event) }))
		.filter((nearby) => nearby.distance <= radius)
		.toSorted((a, b) => a.distance - b.distance);
}
