import React from 'react';
import { SkeletonList, UserRowSkeleton } from '@/shared/theme/components/Skeleton';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import type { UserSearch } from '@/features/user/features/friends/features/friends-list/friendsListTypes';
import { RefreshableList } from '@/features/user/features/friends/features/friends-list/components/presenters/RefreshableList';
import { UserRow } from '@/features/user/features/friends/features/friends-list/components/presenters/UserRow';
import { SearchUsersEmpty } from '@/features/user/features/friends/features/friends-list/components/presenters/SearchUsersEmpty';

type SearchUsersTabProps = {
	search: UserSearch;
	onSelectUser: (userId: string) => void;
	bottomPadding: number;
};

export function SearchUsersTab({ search, onSelectUser, bottomPadding }: SearchUsersTabProps) {
	const column = useContentColumn();

	if (search.isSearching && !search.isRefreshing && search.searchResults.length === 0) {
		return <SkeletonList count={6} row={UserRowSkeleton} style={column} />;
	}

	return (
		<RefreshableList
			data={search.searchResults}
			refresh={search}
			bottomPadding={bottomPadding}
			keyExtractor={item => item.id}
			renderItem={({ item }) => <UserRow user={item} onPress={onSelectUser} />}
			ListEmptyComponent={<SearchUsersEmpty search={search} />}
		/>
	);
}
