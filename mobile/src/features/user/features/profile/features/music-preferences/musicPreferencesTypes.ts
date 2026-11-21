import type { MusicGenre } from '@/shared/users/userTypes';

export type GenreSelection = {
	selectedGenres: MusicGenre[];
	onGenreToggle: (genre: MusicGenre) => void;
};

export type PreferencesSave = {
	isSaving: boolean;
	hasChanges: boolean;
	onSave: () => void;
};
