import { useCallback, useState } from 'react';
import type { MusicGenre } from '@/shared/users/userTypes';
import { MAX_GENRES } from '@/shared/users/userConfig';

const NO_GENRES: MusicGenre[] = [];

export function useGenreSelection(genres: MusicGenre[] | undefined) {
	const [customGenres, setCustomGenres] = useState<MusicGenre[] | null>(null);
	const selectedGenres = customGenres ?? genres ?? NO_GENRES;

	const onGenreToggle = useCallback(
		(genre: MusicGenre) => {
			const toggled = toggledGenres(selectedGenres, genre);
			if (toggled) setCustomGenres(toggled);
		},
		[selectedGenres]
	);

	const reset = useCallback(() => setCustomGenres(null), []);

	return {
		selectedGenres,
		hasChanges: genresChanged(genres ?? NO_GENRES, customGenres),
		onGenreToggle,
		reset,
	};
}

function toggledGenres(selectedGenres: MusicGenre[], genre: MusicGenre): MusicGenre[] | null {
	if (selectedGenres.includes(genre)) return selectedGenres.filter(g => g !== genre);
	if (selectedGenres.length < MAX_GENRES) return [...selectedGenres, genre];
	return null;
}

function genresChanged(initialGenres: MusicGenre[], customGenres: MusicGenre[] | null): boolean {
	if (customGenres === null) return false;
	if (initialGenres.length !== customGenres.length) return true;
	const sortedInitial = initialGenres.toSorted();
	const sortedSelected = customGenres.toSorted();
	return !sortedInitial.every((g, i) => g === sortedSelected[i]);
}
