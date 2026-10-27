import { useEffect, useRef } from 'react';
import { showAlert } from '@/shared/utils/alert';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSession } from '@/shared/services/authSession';
import { ApiError } from '@/shared/services/api';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { logger } from '@/shared/utils/logger';
import { showError, showInfo, showSuccess } from '@/shared/utils/toast';
import { useEvent } from '@/features/events/hooks/useEventQueries';
import { useDeleteEvent } from '@/features/events/hooks/useEventMutations';
import { useBeaconStore } from '@/features/events/stores/beaconStore';
import type { EventStackParamList, MusicEvent } from '@/features/events/types';

type Navigation = NativeStackNavigationProp<EventStackParamList, 'EventDetail'>;

export interface EventDetailScreen {
	event: MusicEvent | undefined;
	isLoading: boolean;
	/** The event could not be loaded (other than deleted). */
	failed: boolean;
	isOrganizer: boolean;
	isDeleting: boolean;
	openPlaylist: () => void;
	edit: () => void;
	remove: () => void;
}

export function useEventDetailScreen(navigation: Navigation, id: string): EventDetailScreen {
	const userId = useSession(session => session.user?.id);
	const query = useEvent(id);
	const deleteEvent = useDeleteEvent();
	const deletingRef = useRef(false);
	const event = query.data;
	const gone = query.error instanceof ApiError && query.error.status === 404;

	useEffect(() => {
		if (!gone || deletingRef.current) return;
		showInfo('Cet événement a été supprimé');
		navigation.goBack();
	}, [gone, navigation]);

	const confirmDelete = async () => {
		deletingRef.current = true;
		try {
			await deleteEvent.mutateAsync(id);
			if (useBeaconStore.getState().eventId === id) useBeaconStore.getState().stop();
			showSuccess('Événement supprimé');
			navigation.goBack();
		} catch (error) {
			deletingRef.current = false;
			logger.error('[EventDetail] Delete failed:', error);
			showError(apiErrorMessage(error, "Impossible de supprimer l'événement"));
		}
	};

	return {
		event,
		isLoading: query.isLoading,
		failed: query.isError && !gone && !event,
		isOrganizer: event !== undefined && event.organizer.id === userId,
		isDeleting: deleteEvent.isPending,
		openPlaylist: () => {
			if (event?.playlist) navigation.navigate('PlaylistDetail', { id: event.playlist.id });
		},
		edit: () => navigation.navigate('EventForm', { eventId: id }),
		remove: () =>
			showAlert(
				"Supprimer l'événement ?",
				`« ${event?.name ?? ''} » disparaîtra pour tout le monde. Cette action est définitive.`,
				[
					{ text: 'Annuler', style: 'cancel' },
					{ text: 'Supprimer', style: 'destructive', onPress: () => void confirmDelete() },
				]
			),
	};
}
