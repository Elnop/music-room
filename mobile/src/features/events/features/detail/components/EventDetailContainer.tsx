import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import type { EventStackParamList } from '@/features/events/eventTypes';
import { useEventDetailScreen } from '@/features/events/features/detail/hooks/useEventDetailScreen';
import { useBeaconBroadcast } from '@/features/events/features/detail/hooks/useBeaconBroadcast';
import { EventDetailView } from '@/features/events/features/detail/components/presenters/EventDetailView';

type EventDetailOrchestratorProps = NativeStackScreenProps<EventStackParamList, 'EventDetail'>;

export function EventDetailContainer({ navigation, route }: EventDetailOrchestratorProps) {
	const screen = useEventDetailScreen(navigation, route.params.id);
	const beacon = useBeaconBroadcast(screen.event);
	const bottomPadding = useBottomPadding();
	return <EventDetailView screen={screen} beacon={beacon} bottomPadding={bottomPadding} />;
}
