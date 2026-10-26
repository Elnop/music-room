import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSession } from '@/shared/services/authSession';
import { logger } from '@/shared/utils/logger';
import { useEvents } from '@/features/events/hooks/useEventQueries';
import type { EventStackParamList, MusicEvent } from '@/features/events/types';

export interface NearbyEvents {
	/** My ongoing and upcoming events, to open and manage them. */
	mine: MusicEvent[];
	openEvent: (id: string) => void;
	createEvent: () => void;
}

export function useNearbyEvents(): NearbyEvents {
	const navigation = useNavigation<NativeStackNavigationProp<EventStackParamList>>();
	const userId = useSession(session => session.user?.id);
	const events = useEvents();

	useEffect(() => {
		if (events.error) logger.error('[NearbyEvents] Failed to load events:', events.error);
	}, [events.error]);

	return {
		mine: (events.data ?? []).filter(event => event.organizer.id === userId),
		openEvent: id => navigation.navigate('EventDetail', { id }),
		createEvent: () => navigation.navigate('EventForm'),
	};
}
