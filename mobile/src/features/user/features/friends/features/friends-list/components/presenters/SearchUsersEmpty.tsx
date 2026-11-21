import React from 'react';
import { StyleSheet } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { UserSearch } from '@/features/user/features/friends/features/friends-list/friendsListTypes';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';
import SearchSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/search-solid.svg';

type SearchUsersEmptyProps = {
	search: UserSearch;
};

export function SearchUsersEmpty({ search }: SearchUsersEmptyProps) {
	const { styles } = useThemedStyles(createStyles);

	if (search.searchFailed && search.searchQuery.trim()) {
		return (
			<EmptyState
				style={styles.emptyState}
				icon={ExclamationTriangleSolid}
				message="La recherche a échoué"
				action={{ label: 'Réessayer', onPress: search.onRetry }}
			/>
		);
	}
	return (
		<EmptyState
			style={styles.emptyState}
			icon={SearchSolid}
			message={
				search.searchQuery
					? 'Aucun utilisateur trouvé'
					: 'Commencez à taper pour trouver des utilisateurs'
			}
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		emptyState: {
			paddingTop: theme.spacing.xxl,
		},
	});
	return styles;
}
