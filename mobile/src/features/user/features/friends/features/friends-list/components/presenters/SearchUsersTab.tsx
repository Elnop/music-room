import React from 'react';
import { FlatList } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { SkeletonList, UserRowSkeleton } from '@/shared/theme/components/Skeleton';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import type { UserProfile } from '@/features/user/features/friends/types';
import { SearchResultItemRow } from '@/features/user/features/friends/features/friends-list/components/presenters/SearchResultItemRow';
import { ThemedRefreshControl } from '@/shared/refresh-control/ThemedRefreshControl';
import { createFriendsListStyles } from '@/features/user/features/friends/features/friends-list/components/presenters/friendsListStyles';
import ExclamationTriangleSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/exclamation-triangle-solid.svg';
import SearchSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/search-solid.svg';

interface SearchUsersTabProps {
	searchResults: UserProfile[];
	searchQuery: string;
	isSearching: boolean;
	searchFailed: boolean;
	isRefreshing: boolean;
	onRefresh: () => void;
	onRetry: () => void;
	onSelectUser: (userId: string) => void;
	bottomPadding: number;
}

export function SearchUsersTab({
	searchResults,
	searchQuery,
	isSearching,
	searchFailed,
	isRefreshing,
	onRefresh,
	onRetry,
	onSelectUser,
	bottomPadding,
}: SearchUsersTabProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createFriendsListStyles(theme), [theme]);
	const column = useContentColumn();

	if (isSearching && !isRefreshing && searchResults.length === 0) {
		return <SkeletonList count={6} row={UserRowSkeleton} style={column} />;
	}

	return (
		<FlatList
			data={searchResults}
			refreshControl={
				<ThemedRefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					color={theme.colors.primary}
				/>
			}
			keyExtractor={item => item.id}
			renderItem={({ item }) => <SearchResultItemRow user={item} onPress={onSelectUser} />}
			contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }, column]}
			ListEmptyComponent={
				searchFailed && searchQuery.trim() ? (
					<EmptyState
						style={styles.emptyState}
						icon={ExclamationTriangleSolid}
						message="La recherche a échoué"
						action={{ label: 'Réessayer', onPress: onRetry }}
					/>
				) : (
					<EmptyState
						style={styles.emptyState}
						icon={SearchSolid}
						message={
							searchQuery
								? 'Aucun utilisateur trouvé'
								: 'Commencez à taper pour trouver des utilisateurs'
						}
					/>
				)
			}
		/>
	);
}
