import React from 'react';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { LoadingSpinner } from '@/shared/theme/components/LoadingSpinner';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';

type EventDetailFallbackProps = {
	failed: boolean;
};

export function EventDetailFallback({ failed }: EventDetailFallbackProps) {
	if (!failed) return <LoadingSpinner />;
	return <EmptyState icon={ExclamationTriangleSolid} message="Impossible de charger l'événement" />;
}
