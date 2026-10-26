import React from 'react';
import { View } from 'react-native';
import { Pressable } from '@/shared/components/ui/Pressable';
import { SearchBar } from '@/shared/components/form/SearchBar';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { FriendProfile, UserProfile } from '@/features/friends/types';
import { FriendsListTab } from './FriendsListTab';
import { SearchUsersTab } from './SearchUsersTab';
import { createFriendsListStyles } from './friendsListStyles';
import { Text } from '@/shared/components/ui/Text';

interface FriendsListViewProps {
	activeTab: 'friends' | 'search';
	friends: FriendProfile[];
	isLoadingFriends: boolean;
	friendsFailed: boolean;
	onRetryFriends: () => void;
	isRefreshingFriends: boolean;
	onRefreshFriends: () => void;
	searchQuery: string;
	onSearchChange: (text: string) => void;
	searchResults: UserProfile[];
	isSearching: boolean;
	searchFailed: boolean;
	isRefreshingSearch: boolean;
	onRefreshSearch: () => void;
	onRetrySearch: () => void;
	hasFriends: boolean;
	canControl: (friendId: string) => boolean;
	togglingUserId: string | null;
	onToggleControl: (friendId: string, current: boolean) => void;
	onSelectUser: (userId: string) => void;
	onTabChange: (tab: 'friends' | 'search') => void;
	bottomPadding: number;
}

export function FriendsListView({
	activeTab,
	friends,
	isLoadingFriends,
	friendsFailed,
	onRetryFriends,
	isRefreshingFriends,
	onRefreshFriends,
	searchQuery,
	onSearchChange,
	searchResults,
	isSearching,
	searchFailed,
	isRefreshingSearch,
	onRefreshSearch,
	onRetrySearch,
	hasFriends,
	canControl,
	togglingUserId,
	onToggleControl,
	onSelectUser,
	onTabChange,
	bottomPadding,
}: FriendsListViewProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createFriendsListStyles(theme), [theme]);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				{hasFriends && (
					<View style={styles.tabsContainer}>
						<Pressable
							style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
							onPress={() => onTabChange('friends')}
							accessibilityLabel={`Mes amis (${friends.length})`}
						>
							<Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
								Mes amis ({friends.length})
							</Text>
						</Pressable>
						<Pressable
							style={[styles.tab, activeTab === 'search' && styles.tabActive]}
							onPress={() => onTabChange('search')}
							accessibilityLabel="Rechercher"
						>
							<Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
								Rechercher
							</Text>
						</Pressable>
					</View>
				)}
				{activeTab === 'search' && (
					<SearchBar
						value={searchQuery}
						onChangeText={onSearchChange}
						placeholder="Rechercher un utilisateur..."
						style={styles.searchBar}
					/>
				)}
			</View>

			{activeTab === 'friends' ? (
				<FriendsListTab
					friends={friends}
					isLoading={isLoadingFriends}
					loadFailed={friendsFailed}
					onRetry={onRetryFriends}
					isRefreshing={isRefreshingFriends}
					onRefresh={onRefreshFriends}
					canControl={canControl}
					togglingUserId={togglingUserId}
					onToggleControl={onToggleControl}
					onSelectUser={onSelectUser}
					onGoToSearch={() => onTabChange('search')}
					bottomPadding={bottomPadding}
				/>
			) : (
				<SearchUsersTab
					searchResults={searchResults}
					searchQuery={searchQuery}
					isSearching={isSearching}
					searchFailed={searchFailed}
					isRefreshing={isRefreshingSearch}
					onRefresh={onRefreshSearch}
					onRetry={onRetrySearch}
					onSelectUser={onSelectUser}
					bottomPadding={bottomPadding}
				/>
			)}
		</View>
	);
}
