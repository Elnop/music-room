import React from 'react';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import type { SearchResults } from '@/features/search/searchTypes';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type SearchEmptyStateProps = {
	results: SearchResults;
	searchQuery: string;
};

export function SearchEmptyState({ results, searchQuery }: SearchEmptyStateProps) {
	if (results.isLoading) return null;
	if (results.isError && results.debouncedQuery.trim()) {
		return (
			<EmptyState
				icon={ExclamationTriangleSolid}
				message="La recherche a échoué"
				action={{ label: 'Réessayer', onPress: results.onRefresh }}
			/>
		);
	}
	return (
		<EmptyState
			icon={MusicSolid}
			message={
				searchQuery
					? 'Aucun titre trouvé'
					: 'Recherchez sur SoundCloud des titres à écouter ou à ajouter à vos playlists'
			}
		/>
	);
}
