import { useEffect } from 'react';
import { useProfilePrivacy } from '@/features/user/features/profile/shared/profile/hooks/useProfileQueries';
import { usePrivacyDraft } from '@/features/user/features/profile/features/privacy-settings/hooks/usePrivacyDraft';
import { useSavePrivacy } from '@/features/user/features/profile/features/privacy-settings/hooks/useSavePrivacy';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { apiErrorMessage } from '@/shared/backend/lib/apiErrorMessage';
import { showError } from '@/shared/theme/lib/toast';

export function usePrivacySettingsScreen() {
	const bottomPadding = useBottomPadding();
	const privacyQuery = useProfilePrivacy();
	const draft = usePrivacyDraft(privacyQuery.data);
	const save = useSavePrivacy(draft);

	useEffect(() => {
		if (privacyQuery.isError && privacyQuery.error) {
			showError(
				apiErrorMessage(
					privacyQuery.error,
					'Impossible de charger les paramètres de confidentialité'
				)
			);
		}
	}, [privacyQuery.isError, privacyQuery.error]);

	return {
		bottomPadding,
		isLoading: privacyQuery.isLoading,
		editing: { privacy: draft.privacy, onVisibilityChange: draft.onVisibilityChange },
		save,
	};
}
