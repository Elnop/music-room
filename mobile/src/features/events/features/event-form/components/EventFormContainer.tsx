import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import type { EventStackParamList } from '@/features/events/lib/types';
import { useEventForm } from '@/features/events/features/event-form/hooks/useEventForm';
import { EventFormView } from '@/features/events/features/event-form/components/presenters/EventFormView';

type EventFormOrchestratorProps = NativeStackScreenProps<EventStackParamList, 'EventForm'>;

export function EventFormContainer({ navigation, route }: EventFormOrchestratorProps) {
	const form = useEventForm(navigation, route.params?.eventId);
	const bottomPadding = useBottomPadding();
	return <EventFormView form={form} bottomPadding={bottomPadding} />;
}
