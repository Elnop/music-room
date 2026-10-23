import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useUserMusicPreferences } from '@/features/profile/hooks/useProfileQueries';
import { useUpdateMusicPreferencesMutation } from '@/features/profile/hooks/useProfileMutations';
import { usePlayerHeight } from '@/shared/services/playbackBridge';
import { useTheme } from '@/shared/theme/ThemeContext';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { showError } from '@/shared/utils/toast';
import type { MusicGenre } from '@/types/user.types';
import { MAX_GENRES } from '@/types/user.types';

export function useMusicPreferences() {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const navigation = useNavigation();

	const preferencesQuery = useUserMusicPreferences();
	const updateMutation = useUpdateMusicPreferencesMutation();

	const [customGenres, setCustomGenres] = useState<MusicGenre[] | null>(null);

	const { data, error, isError } = preferencesQuery;
	const initialGenres = useMemo(() => data?.genres || [], [data?.genres]);
	const selectedGenres = customGenres ?? initialGenres;

	useEffect(() => {
		if (isError && error) {
			showError(apiErrorMessage(error, 'Impossible de charger vos préférences'));
		}
	}, [isError, error]);

	const handleGenreToggle = useCallback(
		(genre: MusicGenre) => {
			const isSelected = selectedGenres.includes(genre);
			if (isSelected) {
				setCustomGenres(selectedGenres.filter(g => g !== genre));
			} else if (selectedGenres.length < MAX_GENRES) {
				setCustomGenres([...selectedGenres, genre]);
			}
		},
		[selectedGenres]
	);

	const hasChanges = useMemo(() => {
		if (customGenres === null) return false;
		if (initialGenres.length !== customGenres.length) return true;
		const sortedInitial = [...initialGenres].sort();
		const sortedSelected = [...customGenres].sort();
		return !sortedInitial.every((g, i) => g === sortedSelected[i]);
	}, [initialGenres, customGenres]);

	const handleSave = useCallback(async () => {
		try {
			await updateMutation.mutateAsync({ genres: selectedGenres });
			setCustomGenres(null);
			navigation.goBack();
		} catch (err) {
			showError(apiErrorMessage(err, "Impossible d'enregistrer vos préférences"));
		}
	}, [navigation, selectedGenres, updateMutation]);

	return {
		theme,
		playerHeight,
		isLoading: preferencesQuery.isLoading,
		isSaving: updateMutation.isPending,
		selectedGenres,
		hasChanges,
		handleGenreToggle,
		handleSave,
	};
}
