import { NEARBY_RADIUS_M } from '@/features/events/features/nearby/configs/nearbyConfig';
import { isOngoing } from '@/features/events/shared/event-dates/eventDates';
import { distanceMeters, formatDistance } from '@/features/events/features/nearby/lib/geo';
import { estimateDistance } from '@/features/events/features/nearby/lib/beaconDistance';
import type { BeaconSighting, NearbyItem } from '@/features/events/features/nearby/nearbyTypes';
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

export function mergeNearby(
	events: MusicEvent[],
	sightings: ReadonlyMap<number, BeaconSighting>,
	position: Coordinates | null,
	now = Date.now(),
): NearbyItem[] {
	const ongoing = events.filter((event) => isOngoing(event, now));
	const heard = ongoing
		.flatMap((event) => {
			const sighting = sightings.get(event.beaconMinor);
			return sighting
				? [{ event, meters: estimateDistance(sighting.rssi, sighting.measuredPower) }]
				: [];
		})
		.toSorted((a, b) => a.meters - b.meters)
		.map(({ event }) => ({ event, proximity: 'Tout près' }));
	const heardIds = new Set(heard.map((item) => item.event.id));
	const located = position
		? nearbyByGps(ongoing, position, now)
				.filter(({ event }) => !heardIds.has(event.id))
				.map(({ event, distance }) => ({ event, proximity: formatDistance(distance) }))
		: [];
	return [...heard, ...located];
}
