import React from 'react';
import { SkeletonList, UserRowSkeleton } from '@/shared/theme/components/Skeleton';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import type {
	FriendControl,
	FriendsListState,
} from '@/features/user/features/friends/features/friends-list/friendsListTypes';
import { useFriendColumns } from '@/features/user/features/friends/features/friends-list/hooks/useFriendColumns';
import { FriendListItem } from '@/features/user/features/friends/features/friends-list/components/presenters/FriendListItem';
import { FriendsListEmpty } from '@/features/user/features/friends/features/friends-list/components/presenters/FriendsListEmpty';
import { RefreshableList } from '@/features/user/features/friends/features/friends-list/components/presenters/RefreshableList';

type FriendsListTabProps = {
	friendsList: FriendsListState;
	control: FriendControl;
	onSelectUser: (userId: string) => void;
	onGoToSearch: () => void;
	bottomPadding: number;
};

export function FriendsListTab(props: FriendsListTabProps) {
	const { friendsList, control, onSelectUser } = props;
	const column = useContentColumn();
	const columns = useFriendColumns(friendsList.friends.length);

	if (friendsList.isLoading && friendsList.friends.length === 0) {
		return <SkeletonList count={6} row={UserRowSkeleton} style={column} />;
	}

	return (
		<RefreshableList
			key={columns}
			numColumns={columns}
			data={friendsList.friends}
			refresh={friendsList}
			bottomPadding={props.bottomPadding}
			keyExtractor={item => item.id}
			renderItem={({ item }) => (
				<FriendListItem friend={item} cell={{ columns, control, onSelectUser }} />
			)}
			ListEmptyComponent={
				<FriendsListEmpty friendsList={friendsList} onGoToSearch={props.onGoToSearch} />
			}
		/>
	);
}
