import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import * as eventsApi from '@/features/events/services/eventsApi';
import { removeEvent, upsertEvent } from '@/features/events/utils/eventCache';
import type { EventInput, MusicEvent } from '@/features/events/types';

function storeEvent(client: QueryClient, event: MusicEvent): void {
	client.setQueryData(queryKeys.events.detail(event.id), event);
	client.setQueryData<MusicEvent[]>(queryKeys.events.list(), list =>
		list ? upsertEvent(list, event) : list
	);
}

export function useCreateEvent() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: (input: EventInput) => eventsApi.createEvent(input),
		onSuccess: event => storeEvent(client, event),
	});
}

interface UpdateVariables {
	id: string;
	changes: Partial<EventInput>;
}

export function useUpdateEvent() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: ({ id, changes }: UpdateVariables) => eventsApi.updateEvent(id, changes),
		onSuccess: event => storeEvent(client, event),
	});
}

export function useDeleteEvent() {
	const client = useQueryClient();
	return useMutation({
		mutationFn: (id: string) => eventsApi.deleteEvent(id),
		onSuccess: (_result, id) => {
			client.removeQueries({ queryKey: queryKeys.events.detail(id) });
			client.setQueryData<MusicEvent[]>(queryKeys.events.list(), list =>
				list ? removeEvent(list, id) : list
			);
		},
	});
}
