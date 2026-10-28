import React from 'react';
import { FlatList } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SkeletonList, UserRowSkeleton } from '@/shared/components/ui/Skeleton';
import { useContentColumn } from '@/shared/hooks/useContentColumn';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { UserProfile } from '@/features/friends/types';
import { SearchResultItemRow } from './SearchResultItemRow';
import { ThemedRefreshControl } from '@/shared/components/lists/ThemedRefreshControl';
import { createFriendsListStyles } from './friendsListStyles';

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
						icon="alert"
						message="La recherche a échoué"
						action={{ label: 'Réessayer', onPress: onRetry }}
					/>
				) : (
					<EmptyState
						style={styles.emptyState}
						icon="search"
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
