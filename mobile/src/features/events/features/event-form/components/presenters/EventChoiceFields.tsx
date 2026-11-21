import React from 'react';
import type { EventForm } from '@/features/events/features/event-form/types/eventFormTypes';
import { DateTimeRow } from '@/features/events/features/event-form/components/presenters/DateTimeRow';
import { GenreSelector } from '@/features/events/features/event-form/components/presenters/GenreSelector';
import { PlaylistSelector } from '@/features/events/features/event-form/components/presenters/PlaylistSelector';

type EventChoiceFieldsProps = {
	form: EventForm;
};

export function EventChoiceFields({ form }: EventChoiceFieldsProps) {
	return (
		<>
			<GenreSelector selected={form.genres} onToggle={form.toggleGenre} error={form.genresError} />
			<DateTimeRow label="Début" value={form.startsAt} onPress={form.pickStart} />
			<DateTimeRow label="Fin" value={form.endsAt} onPress={form.pickEnd} />
			<PlaylistSelector
				playlists={form.playlists}
				selectedId={form.playlistId}
				onSelect={form.selectPlaylist}
			/>
		</>
	);
}
