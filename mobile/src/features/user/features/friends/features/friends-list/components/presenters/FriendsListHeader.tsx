import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SearchBar } from '@/shared/theme/components/SearchBar';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import type {
	FriendsTabs,
	UserSearch,
} from '@/features/user/features/friends/features/friends-list/friendsListTypes';
import { FriendsTabsBar } from '@/features/user/features/friends/features/friends-list/components/presenters/FriendsTabsBar';

type FriendsListHeaderProps = {
	tabs: FriendsTabs;
	friendsCount: number;
	search: UserSearch;
};

export function FriendsListHeader({ tabs, friendsCount, search }: FriendsListHeaderProps) {
	const { styles } = useThemedStyles(createStyles);
	const column = useContentColumn();

	return (
		<View style={[styles.header, column]}>
			{friendsCount > 0 && <FriendsTabsBar tabs={tabs} friendsCount={friendsCount} />}
			{tabs.activeTab === 'search' && (
				<SearchBar
					value={search.searchQuery}
					onChangeText={search.onSearchChange}
					placeholder="Rechercher un utilisateur..."
					style={styles.searchBar}
				/>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		header: {
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.xs,
			paddingBottom: theme.spacing.sm,
		},
		searchBar: {
			marginBottom: theme.spacing.sm,
		},
	});
	return styles;
}
