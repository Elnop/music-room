import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type {
	FriendControl,
	FriendsListState,
	FriendsTabs,
	UserSearch,
} from '@/features/user/features/friends/features/friends-list/friendsListTypes';
import { FriendsListHeader } from '@/features/user/features/friends/features/friends-list/components/presenters/FriendsListHeader';
import { FriendsListTab } from '@/features/user/features/friends/features/friends-list/components/presenters/FriendsListTab';
import { SearchUsersTab } from '@/features/user/features/friends/features/friends-list/components/presenters/SearchUsersTab';

type FriendsListViewProps = {
	tabs: FriendsTabs;
	friendsList: FriendsListState;
	search: UserSearch;
	control: FriendControl;
	onSelectUser: (userId: string) => void;
	bottomPadding: number;
};

export function FriendsListView(props: FriendsListViewProps) {
	const { tabs, friendsList, search } = props;
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.container}>
			<FriendsListHeader tabs={tabs} friendsCount={friendsList.friends.length} search={search} />
			{tabs.activeTab === 'friends' ? (
				<FriendsListTab
					friendsList={friendsList}
					control={props.control}
					onSelectUser={props.onSelectUser}
					onGoToSearch={() => tabs.onTabChange('search')}
					bottomPadding={props.bottomPadding}
				/>
			) : (
				<SearchUsersTab
					search={search}
					onSelectUser={props.onSelectUser}
					bottomPadding={props.bottomPadding}
				/>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
	});
	return styles;
}
