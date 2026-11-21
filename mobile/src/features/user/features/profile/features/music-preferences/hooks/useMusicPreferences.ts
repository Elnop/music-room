import { useEffect } from 'react';
import { useUserMusicPreferences } from '@/features/user/features/profile/shared/profile/hooks/useProfileQueries';
import { useGenreSelection } from '@/features/user/features/profile/features/music-preferences/hooks/useGenreSelection';
import { useSaveMusicPreferences } from '@/features/user/features/profile/features/music-preferences/hooks/useSaveMusicPreferences';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError } from '@/shared/theme/lib/toast';

export function useMusicPreferences() {
	const bottomPadding = useBottomPadding();
	const preferencesQuery = useUserMusicPreferences();
	const selection = useGenreSelection(preferencesQuery.data?.genres);
	const save = useSaveMusicPreferences(selection);

	useEffect(() => {
		if (preferencesQuery.isError && preferencesQuery.error) {
			showError(apiErrorMessage(preferencesQuery.error, 'Impossible de charger vos préférences'));
		}
	}, [preferencesQuery.isError, preferencesQuery.error]);

	return {
		bottomPadding,
		isLoading: preferencesQuery.isLoading,
		selection: { selectedGenres: selection.selectedGenres, onGenreToggle: selection.onGenreToggle },
		save,
	};
}
