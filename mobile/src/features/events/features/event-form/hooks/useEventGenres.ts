import { useState } from 'react';
import type { MusicGenre } from '@/shared/users/userTypes';
import { EVENT_LIMITS } from '@/features/events/features/event-form/eventFormConfig';
import type { EventGenres } from '@/features/events/features/event-form/types/eventFormTypes';

export function useEventGenres(initial: MusicGenre[]): EventGenres {
	const [genres, setGenres] = useState<MusicGenre[]>(initial);
	const [genresError, setGenresError] = useState<string>();

	function toggleGenre(genre: MusicGenre) {
		setGenresError(undefined);
		setGenres((current) => {
			if (current.includes(genre)) return current.filter((g) => g !== genre);
			return current.length < EVENT_LIMITS.GENRES_MAX ? [...current, genre] : current;
		});
	}

	function requireGenres() {
		if (genres.length > 0) return true;
		setGenresError('Choisissez au moins un genre');
		return false;
	}

	return { genres, toggleGenre, genresError, requireGenres };
}
