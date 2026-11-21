import React from 'react';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type SearchTracksEmptyProps = {
	typed: boolean;
};

export function SearchTracksEmpty({ typed }: SearchTracksEmptyProps) {
	return (
		<EmptyState
			icon={MusicSolid}
			message={
				typed
					? 'Aucun titre trouvé'
					: 'Recherchez des titres sur SoundCloud pour les ajouter à votre playlist'
			}
		/>
	);
}
