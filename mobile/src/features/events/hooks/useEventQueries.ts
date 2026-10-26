import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query/keys';
import { STALE } from '@/shared/query/queryClient';
import { useSession } from '@/shared/services/authSession';
import * as eventsApi from '@/features/events/services/eventsApi';
import type { MusicEvent } from '@/features/events/types';

export function useEvents() {
	const signedIn = useSession(session => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.events.list(),
		queryFn: eventsApi.fetchEvents,
		enabled: signedIn,
		staleTime: STALE.short,
	});
}

/** Starts from the list's copy, if any, while the detail loads. */
export function useEvent(id: string) {
	const client = useQueryClient();
	return useQuery({
		queryKey: queryKeys.events.detail(id),
		queryFn: () => eventsApi.fetchEvent(id),
		placeholderData: () =>
			client.getQueryData<MusicEvent[]>(queryKeys.events.list())?.find(event => event.id === id),
		staleTime: STALE.short,
		retry: false,
	});
}

export function usePlaylistChoices(enabled: boolean) {
	const userId = useSession(session => session.user?.id);
	return useQuery({
		queryKey: queryKeys.events.playlistChoices(userId ?? ''),
		queryFn: () => eventsApi.fetchPlaylistChoices(userId ?? ''),
		enabled: enabled && userId !== undefined,
		staleTime: STALE.none,
	});
}
