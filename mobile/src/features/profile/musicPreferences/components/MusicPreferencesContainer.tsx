import React from 'react';
import { useMusicPreferences } from '@/features/profile/musicPreferences/useMusicPreferences';
import { MusicPreferencesView } from './MusicPreferencesView';

export function MusicPreferencesContainer() {
	const {
		theme,
		bottomPadding,
		isLoading,
		isSaving,
		selectedGenres,
		hasChanges,
		handleGenreToggle,
		handleSave,
	} = useMusicPreferences();

	return (
		<MusicPreferencesView
			theme={theme}
			bottomPadding={bottomPadding}
			isLoading={isLoading}
			isSaving={isSaving}
			selectedGenres={selectedGenres}
			hasChanges={hasChanges}
			onGenreToggle={handleGenreToggle}
			onSave={handleSave}
		/>
	);
}
