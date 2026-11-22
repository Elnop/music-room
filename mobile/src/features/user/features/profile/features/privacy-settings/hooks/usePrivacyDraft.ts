import { useCallback, useState } from 'react';
import type { ProfilePrivacy, VisibilityLevel } from '@/shared/users/userTypes';

export function usePrivacyDraft(data: ProfilePrivacy | undefined) {
	const [customPrivacy, setCustomPrivacy] = useState<ProfilePrivacy | null>(null);
	const privacy = customPrivacy ?? data ?? null;

	const onVisibilityChange = useCallback(
		(field: keyof ProfilePrivacy, value: VisibilityLevel) => {
			if (!privacy) return;
			setCustomPrivacy({
				...privacy,
				[field]: value,
			});
		},
		[privacy],
	);

	const reset = useCallback(() => setCustomPrivacy(null), []);

	return { privacy, hasChanges: privacyChanged(customPrivacy, data), onVisibilityChange, reset };
}

function privacyChanged(customPrivacy: ProfilePrivacy | null, data?: ProfilePrivacy): boolean {
	if (!customPrivacy || !data) return false;
	return (
		customPrivacy.emailVisibility !== data.emailVisibility ||
		customPrivacy.bioVisibility !== data.bioVisibility ||
		customPrivacy.avatarVisibility !== data.avatarVisibility ||
		customPrivacy.musicPreferencesVisibility !== data.musicPreferencesVisibility
	);
}
