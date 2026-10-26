import { useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSession } from '@/shared/services/authSession';
import { logger } from '@/shared/utils/logger';
import { NEARBY_CLOCK_MS } from '@/features/events/constants';
import { useEvents } from '@/features/events/hooks/useEventQueries';
import { useNow } from '@/features/events/hooks/useNow';
import { useForegroundPosition } from '@/features/events/nearby/hooks/useForegroundPosition';
import { nearbyNotice, type NearbyNotice } from '@/features/events/nearby/utils/nearbyNotice';
import { nearbyByGps } from '@/features/events/utils/nearbyEvents';
import { formatDistance } from '@/features/events/utils/geo';
import type { EventStackParamList, MusicEvent } from '@/features/events/types';

export interface NearbyItem {
	event: MusicEvent;
	/** "120 m", or "Tout près" for a beacon. */
	proximity: string;
}

export interface NearbyEvents {
	items: NearbyItem[];
	/** Shown when `items` is empty. */
	notice: NearbyNotice;
	/** My ongoing and upcoming events, to open and manage them. */
	mine: MusicEvent[];
	openEvent: (id: string) => void;
	createEvent: () => void;
	requestPermission: () => void;
	openSettings: () => void;
}

export function useNearbyEvents(): NearbyEvents {
	const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
	const userId = useSession(session => session.user?.id);
	const events = useEvents();
	const position = useForegroundPosition();
	const now = useNow(NEARBY_CLOCK_MS);

	useEffect(() => {
		if (events.error) logger.error('[NearbyEvents] Failed to load events:', events.error);
	}, [events.error]);

	const all = events.data;
	const located = position.state.status === 'located' ? position.state.position : null;
	const items = useMemo(
		() =>
			located && all
				? nearbyByGps(all, located, now).map(({ event, distance }) => ({
						event,
						proximity: formatDistance(distance),
					}))
				: [],
		[all, located, now]
	);

	return {
		items,
		notice: nearbyNotice(position.state),
		mine: (all ?? []).filter(event => event.organizer.id === userId),
		openEvent: id => navigation.navigate('EventDetail', { id }),
		createEvent: () => navigation.navigate('EventForm'),
		requestPermission: position.requestPermission,
		openSettings: position.openSettings,
	};
}
