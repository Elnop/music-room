import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useUpdateMusicPreferencesMutation } from '@/features/user/features/profile/shared/profile/hooks/useProfileMutations';
import type { useGenreSelection } from '@/features/user/features/profile/features/music-preferences/hooks/useGenreSelection';
import type { PreferencesSave } from '@/features/user/features/profile/features/music-preferences/musicPreferencesTypes';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError } from '@/shared/theme/lib/toast';

export function useSaveMusicPreferences(
	selection: ReturnType<typeof useGenreSelection>,
): PreferencesSave {
	const navigation = useNavigation();
	const updateMutation = useUpdateMusicPreferencesMutation();
	const { selectedGenres, reset } = selection;

	const onSave = useCallback(async () => {
		try {
			await updateMutation.mutateAsync({ genres: selectedGenres });
			reset();
			navigation.goBack();
		} catch (err) {
			showError(apiErrorMessage(err, "Impossible d'enregistrer vos préférences"));
		}
	}, [navigation, selectedGenres, updateMutation, reset]);

	return { isSaving: updateMutation.isPending, hasChanges: selection.hasChanges, onSave };
}
