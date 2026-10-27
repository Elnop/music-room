import React from 'react';
import { useSimilarProfilesSection } from '@/features/friends/similarProfiles/hooks/useSimilarProfilesSection';
import { SimilarProfilesSection } from '@/features/friends/similarProfiles/components/presenters/SimilarProfilesSection';

export function SimilarProfilesOrchestrator() {
	const section = useSimilarProfilesSection();
	return <SimilarProfilesSection section={section} />;
}
