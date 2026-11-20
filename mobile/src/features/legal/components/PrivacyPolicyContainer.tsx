import React from 'react';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { useTheme } from '@/shared/theme/components/ThemeContext';
import { OPEN_LINK_FAILED, openExternalUrl } from '@/shared/external-links/openExternalUrl';
import { showError } from '@/shared/theme/lib/toast';
import { PrivacyPolicyView } from '@/features/legal/components/presenters/PrivacyPolicyView';

export function PrivacyPolicyContainer() {
	const { theme } = useTheme();
	const bottomPadding = useBottomPadding();

	return (
		<PrivacyPolicyView theme={theme} bottomPadding={bottomPadding} onOpenLink={url => openExternalUrl(url, () => showError(OPEN_LINK_FAILED))} />
	);
}
