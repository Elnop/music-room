import type { FriendProfile, UserProfile } from '@/features/user/features/friends/friendsTypes';

export type FriendsTab = 'friends' | 'search';

export type FriendsTabs = {
	activeTab: FriendsTab;
	onTabChange: (tab: FriendsTab) => void;
};

export type FriendsListState = {
	friends: FriendProfile[];
	isLoading: boolean;
	loadFailed: boolean;
	onRetry: () => void;
	isRefreshing: boolean;
	onRefresh: () => void;
};

export type FriendControl = {
	canControl: (friendId: string) => boolean;
	togglingUserId: string | null;
	onToggleControl: (friendId: string, current: boolean) => void;
};

export type UserSearch = {
	searchQuery: string;
	onSearchChange: (text: string) => void;
	searchResults: UserProfile[];
	isSearching: boolean;
	searchFailed: boolean;
	isRefreshing: boolean;
	onRefresh: () => void;
	onRetry: () => void;
};

export type UserSearchRequest = {
	results: UserProfile[];
	isSearching: boolean;
	failed: boolean;
};

export type ListRefresh = {
	isRefreshing: boolean;
	onRefresh: () => void;
};

export type FriendCell = {
	columns: number;
	control: FriendControl;
	onSelectUser: (userId: string) => void;
};
