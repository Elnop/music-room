import { isOngoing } from '@/features/events/shared/event-dates/eventDates';
import { formatDistance } from '@/features/events/features/nearby/lib/geo';
import { nearbyByGps } from '@/features/events/features/nearby/lib/nearbyByGps';
import { estimateDistance } from '@/features/events/features/nearby/lib/beaconDistance';
import type { BeaconSighting, NearbyItem } from '@/features/events/features/nearby/nearbyTypes';
import type { Coordinates, MusicEvent } from '@/features/events/eventTypes';

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
