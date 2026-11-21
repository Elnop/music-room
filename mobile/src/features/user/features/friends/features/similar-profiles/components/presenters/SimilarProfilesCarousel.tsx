import React from 'react';
import { SnapCarousel } from '@/shared/theme/components/SnapCarousel';
import type { SimilarProfilesSection } from '@/features/user/features/friends/features/similar-profiles/similarProfilesTypes';
import { SIMILAR_CARD_WIDTH } from '@/features/user/features/friends/features/similar-profiles/similarProfilesConfig';
import { SimilarProfileCard } from '@/features/user/features/friends/features/similar-profiles/components/presenters/SimilarProfileCard';

type SimilarProfilesCarouselProps = {
	section: SimilarProfilesSection;
};

export function SimilarProfilesCarousel({ section }: SimilarProfilesCarouselProps) {
	return (
		<SnapCarousel itemWidth={SIMILAR_CARD_WIDTH}>
			{section.profiles.map(profile => (
				<SimilarProfileCard key={profile.id} profile={profile} onOpen={section.openProfile} />
			))}
		</SnapCarousel>
	);
}
