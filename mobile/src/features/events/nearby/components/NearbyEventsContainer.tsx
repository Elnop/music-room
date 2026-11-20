import React from 'react';
import { useNearbyEvents } from '@/features/events/nearby/hooks/useNearbyEvents';
import { NearbyEventsSection } from '@/features/events/nearby/components/presenters/NearbyEventsSection';

export function NearbyEventsContainer() {
	const nearby = useNearbyEvents();
	return <NearbyEventsSection nearby={nearby} />;
}
