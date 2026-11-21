import { useEffect, useRef } from 'react';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { logger } from '@/shared/logging/logger';
import { showError, showInfo, showSuccess } from '@/shared/theme/lib/toast';
import { useDeleteEvent } from '@/features/events/shared/events/hooks/useEventMutations';
import { beaconActions, beaconStore } from '@/features/events/features/detail/beaconStore';
import type { EventDetailNavigation } from '@/features/events/features/detail/eventDetailTypes';

type EventDeletionArgs = {
	navigation: EventDetailNavigation;
	id: string;
	gone: boolean;
};

export function useEventDeletion({ navigation, id, gone }: EventDeletionArgs) {
	const deleteEvent = useDeleteEvent();
	const deletingRef = useRef(false);

	useEffect(() => {
		if (!gone || deletingRef.current) return;
		showInfo('Cet événement a été supprimé');
		navigation.goBack();
	}, [gone, navigation]);

	async function confirmDelete() {
		deletingRef.current = true;
		try {
			await deleteEvent.mutateAsync(id);
			if (beaconStore.getState().eventId === id) beaconActions.stop();
			showSuccess('Événement supprimé');
			navigation.goBack();
		} catch (error) {
			deletingRef.current = false;
			logger.error('[EventDetail] Delete failed:', error);
			showError(apiErrorMessage(error, "Impossible de supprimer l'événement"));
		}
	}

	return { isDeleting: deleteEvent.isPending, confirmDelete };
}
