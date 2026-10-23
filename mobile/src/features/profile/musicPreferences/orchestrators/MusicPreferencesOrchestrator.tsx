import React from 'react';
import { useMusicPreferences } from '@/features/profile/musicPreferences/hooks/useMusicPreferences';
import { MusicPreferencesView } from '@/features/profile/musicPreferences/presenters/MusicPreferencesView';

export function MusicPreferencesOrchestrator() {
	const {
		theme,
		playerHeight,
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
			playerHeight={playerHeight}
			isLoading={isLoading}
			isSaving={isSaving}
			selectedGenres={selectedGenres}
			hasChanges={hasChanges}
			onGenreToggle={handleGenreToggle}
			onSave={handleSave}
		/>
	);
}
