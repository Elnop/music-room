import React from 'react';
import { View } from 'react-native';
import { SectionHeader } from '@/shared/theme/components/SectionHeader';
import type { SimilarProfilesSection as Section } from '@/features/user/features/friends/features/similar-profiles/similarProfilesTypes';
import { SimilarProfilesBody } from '@/features/user/features/friends/features/similar-profiles/components/presenters/SimilarProfilesBody';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type SimilarProfilesSectionProps = {
	section: Section;
};

export function SimilarProfilesSection({ section }: SimilarProfilesSectionProps) {
	return (
		<View>
			<SectionHeader
				icon={MusicSolid}
				title="Profils aux goûts proches"
				count={section.profiles.length}
			/>
			<SimilarProfilesBody section={section} />
		</View>
	);
}
