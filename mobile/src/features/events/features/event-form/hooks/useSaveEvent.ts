import { logger } from '@/shared/logging/logger';
import { showError, showSuccess } from '@/shared/theme/lib/toast';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import {
	useCreateEvent,
	useUpdateEvent,
} from '@/features/events/shared/events/hooks/useEventMutations';
import type { EventFormNavigation } from '@/features/events/features/event-form/types/eventFormTypes';
import type { EventInput } from '@/features/events/eventTypes';

export function useSaveEvent(navigation: EventFormNavigation, eventId: string | undefined) {
	const create = useCreateEvent();
	const update = useUpdateEvent();

	return async function save(input: EventInput) {
		try {
			if (eventId !== undefined) {
				await update.mutateAsync({ id: eventId, changes: input });
				showSuccess('Événement modifié');
				navigation.goBack();
			} else {
				const event = await create.mutateAsync(input);
				navigation.replace('EventDetail', { id: event.id });
			}
		} catch (error) {
			logger.error('[EventForm] Save failed:', error);
			showError(apiErrorMessage(error, "Impossible d'enregistrer l'événement"));
		}
	};
}
