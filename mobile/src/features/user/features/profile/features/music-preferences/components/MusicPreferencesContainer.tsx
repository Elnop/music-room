import React from 'react';
import { useMusicPreferences } from '@/features/user/features/profile/features/music-preferences/hooks/useMusicPreferences';
import { MusicPreferencesView } from '@/features/user/features/profile/features/music-preferences/components/presenters/MusicPreferencesView';

export function MusicPreferencesContainer() {
	const preferences = useMusicPreferences();

	return (
		<MusicPreferencesView
			bottomPadding={preferences.bottomPadding}
			isLoading={preferences.isLoading}
			selection={preferences.selection}
			save={preferences.save}
		/>
	);
}
