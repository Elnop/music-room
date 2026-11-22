import { showAlert } from '@/shared/alerts/showAlert';
import { useSession } from '@/shared/backend/hooks/useSession';
import { ApiError } from '@/shared/backend/lib/ApiError';
import { useEvent } from '@/features/events/shared/events/hooks/useEventQueries';
import { useEventDeletion } from '@/features/events/features/detail/hooks/useEventDeletion';
import type {
	EventDetailNavigation,
	EventDetailScreen,
} from '@/features/events/features/detail/eventDetailTypes';
import type { MusicEvent } from '@/features/events/eventTypes';

type DetailActionsArgs = {
	navigation: EventDetailNavigation;
	id: string;
	event: MusicEvent | undefined;
	confirmDelete: () => Promise<void>;
};

function detailActions({ navigation, id, event, confirmDelete }: DetailActionsArgs) {
	return {
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

export function useEventDetailScreen(
	navigation: EventDetailNavigation,
	id: string
): EventDetailScreen {
	const userId = useSession(session => session.user?.id);
	const query = useEvent(id);
	const gone = query.error instanceof ApiError && query.error.status === 404;
	const deletion = useEventDeletion({ navigation, id, gone });
	const event = query.data;

	return {
		event,
		isLoading: query.isLoading,
		failed: query.isError && !gone && !event,
		isOrganizer: event !== undefined && event.organizer.id === userId,
		isDeleting: deletion.isDeleting,
		...detailActions({ navigation, id, event, confirmDelete: deletion.confirmDelete }),
	};
}
