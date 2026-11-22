import { useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSession } from '@/shared/backend/hooks/useSession';
import { logger } from '@/shared/logging/logger';
import { NEARBY_CLOCK_MS } from '@/features/events/features/nearby/configs/nearbyConfig';
import { useEvents } from '@/features/events/shared/events/hooks/useEventQueries';
import { useNow } from '@/features/events/features/nearby/hooks/useNow';
import { useForegroundPosition } from '@/features/events/features/nearby/hooks/useForegroundPosition';
import { useBeaconScan } from '@/features/events/features/nearby/hooks/useBeaconScan';
import { nearbyNotice } from '@/features/events/features/nearby/lib/nearbyNotice';
import { mergeNearby } from '@/features/events/features/nearby/lib/nearbyEvents';
import type {
	BeaconSighting,
	NearbyEvents,
	NearbyItem,
	PositionState,
} from '@/features/events/features/nearby/nearbyTypes';
import type { EventStackParamList, MusicEvent } from '@/features/events/eventTypes';

function useEventLists() {
	const userId = useSession((session) => session.user?.id);
	const events = useEvents();

	useEffect(() => {
		if (events.error) logger.error('[NearbyEvents] Failed to load events:', events.error);
	}, [events.error]);

	const all = events.data;
	return { all, mine: (all ?? []).filter((event) => event.organizer.id === userId) };
}

function useNearbyItems(
	all: MusicEvent[] | undefined,
	sightings: ReadonlyMap<number, BeaconSighting>,
	position: PositionState,
): NearbyItem[] {
	const now = useNow(NEARBY_CLOCK_MS);
	const located = position.status === 'located' ? position.position : null;
	return useMemo(
		() => (all ? mergeNearby(all, sightings, located, now) : []),
		[all, sightings, located, now],
	);
}

export function useNearbyEvents(): NearbyEvents {
	const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
	const lists = useEventLists();
	const position = useForegroundPosition();
	const beacons = useBeaconScan();
	const items = useNearbyItems(lists.all, beacons.sightings, position.state);

	return {
		items,
		notice: nearbyNotice(position.state),
		mine: lists.mine,
		openEvent: (id) => navigation.navigate('EventDetail', { id }),
		createEvent: () => navigation.navigate('EventForm'),
		requestPermission: position.requestPermission,
		openSettings: position.openSettings,
		beaconStatus: beacons.status,
		requestBeaconPermission: beacons.requestPermission,
	};
}
