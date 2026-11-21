import { useState } from 'react';
import { useEventGenres } from '@/features/events/features/event-form/hooks/useEventGenres';
import { useEventSchedule } from '@/features/events/features/event-form/hooks/useEventSchedule';
import type { EventDraft } from '@/features/events/features/event-form/types/eventFormTypes';
import type { MusicEvent } from '@/features/events/eventTypes';

export function useEventDraft(edited: MusicEvent | undefined): EventDraft {
	const genres = useEventGenres(edited?.genres ?? []);
	const schedule = useEventSchedule(edited);
	const [playlistId, setPlaylistId] = useState(edited?.playlist?.id ?? null);
	return { ...genres, ...schedule, playlistId, selectPlaylist: setPlaylistId };
}
