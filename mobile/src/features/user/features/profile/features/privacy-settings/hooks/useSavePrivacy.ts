import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useUpdatePrivacyMutation } from '@/features/user/features/profile/shared/profile/hooks/useProfileMutations';
import type { usePrivacyDraft } from '@/features/user/features/profile/features/privacy-settings/hooks/usePrivacyDraft';
import { useUnsavedPrivacyGuard } from '@/features/user/features/profile/features/privacy-settings/hooks/useUnsavedPrivacyGuard';
import type { PrivacySave } from '@/features/user/features/profile/features/privacy-settings/privacySettingsTypes';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError } from '@/shared/theme/lib/toast';
import type { ProfilePrivacy } from '@/shared/users/userTypes';

export function useSavePrivacy(draft: ReturnType<typeof usePrivacyDraft>): PrivacySave {
	const navigation = useNavigation();
	const updateMutation = useUpdatePrivacyMutation();
	const savedRef = useUnsavedPrivacyGuard(draft.hasChanges);

	const onSave = useCallback(async () => {
		if (!draft.privacy) return;

		try {
			await updateMutation.mutateAsync(visibilitySettings(draft.privacy));
			savedRef.current = true;
			draft.reset();
			navigation.goBack();
		} catch (err) {
			showError(apiErrorMessage(err, "Impossible d'enregistrer les paramètres de confidentialité"));
		}
	}, [navigation, draft, updateMutation, savedRef]);

	return { isSaving: updateMutation.isPending, hasChanges: draft.hasChanges, onSave };
}

function visibilitySettings(privacy: ProfilePrivacy) {
	return {
		emailVisibility: privacy.emailVisibility,
		bioVisibility: privacy.bioVisibility,
		avatarVisibility: privacy.avatarVisibility,
		musicPreferencesVisibility: privacy.musicPreferencesVisibility,
	};
}
