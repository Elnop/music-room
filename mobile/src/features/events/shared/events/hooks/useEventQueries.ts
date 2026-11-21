import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query-keys/queryKeys';
import { STALE } from '@/shared/backend/configs/staleQueryConfig';
import { useSession } from '@/shared/backend/hooks/useSession';
import * as eventsApi from '@/features/events/shared/events/lib/eventsApi';
import type { MusicEvent } from '@/features/events/lib/types';

export function useEvents() {
	const signedIn = useSession(session => session.isAuthenticated);
	return useQuery({
		queryKey: queryKeys.events.list(),
		queryFn: eventsApi.fetchEvents,
		enabled: signedIn,
		staleTime: STALE.short,
	});
}

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
