import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import { useProfilePrivacy } from '@/features/profile/hooks/useProfileQueries';
import { useUpdatePrivacyMutation } from '@/features/profile/hooks/useProfileMutations';
import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import { useTheme } from '@/shared/theme/ThemeContext';
import { apiErrorMessage } from '@/shared/utils/apiErrorMessage';
import { showError } from '@/shared/utils/toast';
import type { ProfilePrivacy, VisibilityLevel } from '@/types/user.types';

export function usePrivacySettingsScreen() {
	const { theme } = useTheme();
	const bottomPadding = useBottomPadding();
	const navigation = useNavigation();

	const privacyQuery = useProfilePrivacy();
	const updateMutation = useUpdatePrivacyMutation();

	const [customPrivacy, setCustomPrivacy] = useState<ProfilePrivacy | null>(null);

	const { data, error, isError } = privacyQuery;
	const privacy = customPrivacy ?? data ?? null;

	useEffect(() => {
		if (isError && error) {
			showError(apiErrorMessage(error, 'Impossible de charger les paramètres de confidentialité'));
		}
	}, [isError, error]);

	const handleVisibilityChange = useCallback(
		(field: keyof ProfilePrivacy, value: VisibilityLevel) => {
			if (!privacy) return;
			setCustomPrivacy({
				...privacy,
				[field]: value,
			});
		},
		[privacy]
	);

	const hasChanges = useMemo(() => {
		if (!customPrivacy || !data) return false;
		return (
			customPrivacy.emailVisibility !== data.emailVisibility ||
			customPrivacy.bioVisibility !== data.bioVisibility ||
			customPrivacy.avatarVisibility !== data.avatarVisibility ||
			customPrivacy.musicPreferencesVisibility !== data.musicPreferencesVisibility
		);
	}, [customPrivacy, data]);

	const savedRef = useRef(false);

	usePreventRemove(hasChanges, ({ data: navData }) => {
		if (savedRef.current) {
			navigation.dispatch(navData.action);
			return;
		}
		Alert.alert(
			'Quitter sans enregistrer ?',
			'Vos modifications de confidentialité seront perdues.',
			[
				{ text: 'Annuler', style: 'cancel' },
				{
					text: 'Quitter sans enregistrer',
					style: 'destructive',
					onPress: () => navigation.dispatch(navData.action),
				},
			]
		);
	});

	const handleSave = useCallback(async () => {
		if (!privacy) return;

		try {
			await updateMutation.mutateAsync({
				emailVisibility: privacy.emailVisibility,
				bioVisibility: privacy.bioVisibility,
				avatarVisibility: privacy.avatarVisibility,
				musicPreferencesVisibility: privacy.musicPreferencesVisibility,
			});
			savedRef.current = true;
			setCustomPrivacy(null);
			navigation.goBack();
		} catch (err) {
			showError(apiErrorMessage(err, "Impossible d'enregistrer les paramètres de confidentialité"));
		}
	}, [navigation, privacy, updateMutation]);

	return {
		theme,
		bottomPadding,
		isLoading: privacyQuery.isLoading,
		isSaving: updateMutation.isPending,
		privacy,
		hasChanges,
		handleVisibilityChange,
		handleSave,
	};
}
