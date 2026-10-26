import { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { logger } from '@/shared/utils/logger';
import { showError, showSuccess } from '@/shared/utils/toast';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { useCappedField, type CappedField } from '@/shared/hooks/useCappedField';
import { queryKeys } from '@/shared/query/keys';
import type { MusicGenre } from '@/types/user.types';
import { useCreateEvent, useUpdateEvent } from '@/features/events/hooks/useEventMutations';
import { usePlaylistChoices } from '@/features/events/hooks/useEventQueries';
import { useEventPlace, type EventPlace } from '@/features/events/form/hooks/useEventPlace';
import { pickDateTime } from '@/features/events/utils/pickDateTime';
import { defaultSchedule, scheduleError } from '@/features/events/utils/eventDates';
import { EVENT_LIMITS, eventFormSchema, type EventFormInput } from '@/features/events/validators';
import type {
	EventInput,
	EventStackParamList,
	MusicEvent,
	PlaylistChoice,
} from '@/features/events/types';

type Navigation = NativeStackNavigationProp<EventStackParamList, 'EventForm'>;

export interface EventForm {
	isEditing: boolean;
	name: CappedField;
	description: CappedField;
	address: CappedField;
	accessInfo: CappedField;
	place: EventPlace;
	genres: MusicGenre[];
	toggleGenre: (genre: MusicGenre) => void;
	genresError?: string;
	startsAt: Date;
	endsAt: Date;
	pickStart: () => void;
	pickEnd: () => void;
	playlists: PlaylistChoice[];
	playlistId: string | null;
	selectPlaylist: (id: string | null) => void;
	submit: () => void;
	isSubmitting: boolean;
}

const orNull = (text: string) => (text.trim() ? text.trim() : null);

function useEditedEvent(eventId: string | undefined): MusicEvent | undefined {
	const client = useQueryClient();
	// Prefilled once: later socket updates must not reset what the user is typing.
	const [edited] = useState(() =>
		eventId === undefined
			? undefined
			: (client.getQueryData<MusicEvent>(queryKeys.events.detail(eventId)) ??
				client.getQueryData<MusicEvent[]>(queryKeys.events.list())?.find(e => e.id === eventId))
	);
	return edited;
}

export function useEventForm(navigation: Navigation, eventId: string | undefined): EventForm {
	const edited = useEditedEvent(eventId);
	const [schedule] = useState(defaultSchedule);
	const [genres, setGenres] = useState<MusicGenre[]>(edited?.genres ?? []);
	const [genresError, setGenresError] = useState<string>();
	const [startsAt, setStartsAt] = useState(() =>
		edited ? new Date(edited.startsAt) : schedule.startsAt
	);
	const [endsAt, setEndsAt] = useState(() => (edited ? new Date(edited.endsAt) : schedule.endsAt));
	const [playlistId, setPlaylistId] = useState(edited?.playlist?.id ?? null);
	const playlists = usePlaylistChoices(true);
	const create = useCreateEvent();
	const update = useUpdateEvent();
	const { control, handleSubmit, formState, setValue } = useForm<EventFormInput>({
		resolver: zodResolver(eventFormSchema),
		defaultValues: {
			name: edited?.name ?? '',
			description: edited?.description ?? '',
			address: edited?.address ?? '',
			accessInfo: edited?.accessInfo ?? '',
		},
	});
	const place = useEventPlace(edited, address =>
		setValue('address', address, { shouldValidate: true })
	);

	const toggleGenre = (genre: MusicGenre) => {
		setGenresError(undefined);
		setGenres(current =>
			current.includes(genre)
				? current.filter(g => g !== genre)
				: current.length < EVENT_LIMITS.GENRES_MAX
					? [...current, genre]
					: current
		);
	};

	// Moving the start past the end keeps the event's length.
	const moveStart = (date: Date) => {
		const length = endsAt.getTime() - startsAt.getTime();
		setStartsAt(date);
		if (endsAt.getTime() <= date.getTime()) setEndsAt(new Date(date.getTime() + length));
	};

	const onSubmit = async (data: EventFormInput) => {
		if (genres.length === 0) {
			setGenresError('Choisissez au moins un genre');
			return;
		}
		const invalidSchedule = scheduleError(startsAt, endsAt);
		if (invalidSchedule) {
			showError(invalidSchedule);
			return;
		}
		const coordinates = await place.resolve(data.address);
		if (!coordinates) return;

		const input: EventInput = {
			name: data.name.trim(),
			description: orNull(data.description),
			address: data.address.trim(),
			...coordinates,
			accessInfo: orNull(data.accessInfo),
			genres,
			startsAt: startsAt.toISOString(),
			endsAt: endsAt.toISOString(),
			playlistId,
		};
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

	return {
		isEditing: eventId !== undefined,
		name: useCappedField(control, 'name', EVENT_LIMITS.NAME_MAX),
		description: useCappedField(control, 'description', EVENT_LIMITS.TEXT_MAX),
		address: useCappedField(control, 'address', EVENT_LIMITS.ADDRESS_MAX),
		accessInfo: useCappedField(control, 'accessInfo', EVENT_LIMITS.TEXT_MAX),
		place,
		genres,
		toggleGenre,
		genresError,
		startsAt,
		endsAt,
		pickStart: () => void pickDateTime(startsAt).then(date => date && moveStart(date)),
		pickEnd: () => void pickDateTime(endsAt).then(date => date && setEndsAt(date)),
		playlists: playlists.data ?? [],
		playlistId,
		selectPlaylist: setPlaylistId,
		submit: handleSubmit(onSubmit),
		isSubmitting: formState.isSubmitting,
	};
}
