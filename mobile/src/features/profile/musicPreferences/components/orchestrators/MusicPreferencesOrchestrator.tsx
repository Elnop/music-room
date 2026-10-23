import React from 'react';
import { useMusicPreferences } from '@/features/profile/musicPreferences/hooks/useMusicPreferences';
import { MusicPreferencesView } from '@/features/profile/musicPreferences/components/presenters/MusicPreferencesView';

export function MusicPreferencesOrchestrator() {
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
