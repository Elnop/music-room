import React from 'react';
import { useBottomPadding } from '@/shared/theme/hooks/useBottomPadding';
import { openExternalUrl } from '@/shared/external-links/openExternalUrl';
import { showError } from '@/shared/theme/lib/toast';
import { PrivacyPolicyView } from '@/features/legal/components/presenters/PrivacyPolicyView';

export function PrivacyPolicyContainer() {
	const bottomPadding = useBottomPadding();

	return (
		<PrivacyPolicyView
			bottomPadding={bottomPadding}
			onOpenLink={(url) => openExternalUrl(url, showError)}
		/>
	);
}
