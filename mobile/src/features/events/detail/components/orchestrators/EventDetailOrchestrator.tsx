import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import type { EventStackParamList } from '@/features/events/types';
import { useEventDetailScreen } from '@/features/events/detail/hooks/useEventDetailScreen';
import { EventDetailView } from '@/features/events/detail/components/presenters/EventDetailView';

type EventDetailOrchestratorProps = NativeStackScreenProps<EventStackParamList, 'EventDetail'>;

export function EventDetailOrchestrator({ navigation, route }: EventDetailOrchestratorProps) {
	const screen = useEventDetailScreen(navigation, route.params.id);
	const bottomPadding = useBottomPadding();
	return <EventDetailView screen={screen} bottomPadding={bottomPadding} />;
}
