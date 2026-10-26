import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import type { EventStackParamList } from '@/features/events/types';
import { useEventForm } from '@/features/events/form/hooks/useEventForm';
import { EventFormView } from '@/features/events/form/components/presenters/EventFormView';

type EventFormOrchestratorProps = NativeStackScreenProps<EventStackParamList, 'EventForm'>;

export function EventFormOrchestrator({ navigation, route }: EventFormOrchestratorProps) {
	const form = useEventForm(navigation, route.params?.eventId);
	const bottomPadding = useBottomPadding();
	return <EventFormView form={form} bottomPadding={bottomPadding} />;
}
