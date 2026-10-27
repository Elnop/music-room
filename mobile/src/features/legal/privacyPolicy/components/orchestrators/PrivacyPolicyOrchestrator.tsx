import React from 'react';
import { useBottomPadding } from '@/shared/hooks/useBottomPadding';
import { useTheme } from '@/shared/theme/ThemeContext';
import { openExternalUrl } from '@/shared/utils/openExternalUrl';
import { PrivacyPolicyView } from '@/features/legal/privacyPolicy/components/presenters/PrivacyPolicyView';

export function PrivacyPolicyOrchestrator() {
	const { theme } = useTheme();
	const bottomPadding = useBottomPadding();

	return (
		<PrivacyPolicyView theme={theme} bottomPadding={bottomPadding} onOpenLink={openExternalUrl} />
	);
}
