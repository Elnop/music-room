import React from 'react';
import { useNearbyEvents } from '@/features/events/features/nearby/hooks/useNearbyEvents';
import { NearbyEventsSection } from '@/features/events/features/nearby/components/presenters/NearbyEventsSection';

export function NearbyEventsContainer() {
	const nearby = useNearbyEvents();
	return <NearbyEventsSection nearby={nearby} />;
}
