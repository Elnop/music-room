import React from 'react';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import type { SimilarProfilesSection } from '@/features/user/features/friends/features/similar-profiles/similarProfilesTypes';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type SimilarProfilesNoticeProps = {
	section: SimilarProfilesSection;
};

export function SimilarProfilesNotice({ section }: SimilarProfilesNoticeProps) {
	if (section.status === 'error') {
		return (
			<EmptyState
				icon={ExclamationTriangleSolid}
				message="Impossible de charger les suggestions"
				action={{ label: 'Réessayer', onPress: section.retry }}
				compact
			/>
		);
	}
	return (
		<EmptyState
			icon={MusicSolid}
			message="Choisissez vos genres préférés pour découvrir des profils qui vous ressemblent"
			action={{ label: 'Choisir mes genres', onPress: section.openPreferences }}
			compact
		/>
	);
}
