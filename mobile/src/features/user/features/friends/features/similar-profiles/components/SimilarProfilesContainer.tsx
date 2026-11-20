import React from 'react';
import { useSimilarProfilesSection } from '@/features/user/features/friends/features/similar-profiles/useSimilarProfilesSection';
import { SimilarProfilesSection } from '@/features/user/features/friends/features/similar-profiles/components/presenters/SimilarProfilesSection';

export function SimilarProfilesContainer() {
	const section = useSimilarProfilesSection();
	return <SimilarProfilesSection section={section} />;
}
