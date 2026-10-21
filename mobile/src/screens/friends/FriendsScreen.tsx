import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { ThemedSwitch } from '@components/common/ThemedSwitch';
import { showError } from '@utils/toast';
import { apiErrorMessage } from '@utils/apiErrorMessage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { debounce } from '@/utils/debounce';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlayerHeight } from '@/contexts/PlayerContext';
import type { Theme } from '@themes/types';
import { useAuthStore } from '@/store/authStore';
import { profileApi } from '@/services/profileApi';
import { friendsApi, FriendProfile } from '@/services/friendsApi';
import { musicControlApi } from '@/services/musicControlApi';
import { SearchBar } from '@/components/common/SearchBar';
import { EmptyState } from '@/components/common/EmptyState';
import { Avatar } from '@/components/common/Avatar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { SkeletonList, UserRowSkeleton } from '@/components/common/Skeleton';
import type { UserProfile } from '@/types/user.types';
import type { FriendsStackParamList } from '@/navigation/stacks/FriendsStack';

type NavigationProp = NativeStackNavigationProp<FriendsStackParamList, 'Friends'>;

type Tab = 'friends' | 'search';

export function FriendsScreen() {
	const { theme } = useTheme();
	const playerHeight = usePlayerHeight();
	const styles = React.useMemo(() => createStyles(theme), [theme]);
	const navigation = useNavigation<NavigationProp>();
	const { accessToken } = useAuthStore();

	const [activeTab, setActiveTab] = useState<Tab>('friends');
	const [friends, setFriends] = useState<FriendProfile[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const hasMountedRef = useRef(false);

	const [searchQuery, setSearchQuery] = useState('');
	const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	// The last search for the current query failed: the list must not say "no result".
	const [searchFailed, setSearchFailed] = useState(false);

	// Music control permissions: Set of friend IDs that can control my music
	const [controlPermissions, setControlPermissions] = useState<Set<string>>(new Set());
	const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

	const loadFriends = useCallback(
		async (silent = false) => {
			if (!accessToken) return;

			// Only show spinner on first load (no cached data)
			if (!silent) {
				setIsLoading(true);
			}

			try {
				const data = await friendsApi.getFriends(accessToken);
				setFriends(data);
				if (data.length === 0 && activeTab === 'friends') {
					setActiveTab('search');
				}
			} catch (err) {
				console.error('[FriendsScreen] Failed to load friends:', err);
			} finally {
				setIsLoading(false);
			}
		},
		[accessToken, activeTab]
	);

	const loadPermissions = useCallback(async () => {
		try {
			const allowedUserIds = await musicControlApi.getMyPermissions();
			setControlPermissions(new Set(allowedUserIds));
		} catch (err) {
			console.error('[FriendsScreen] Failed to load permissions:', err);
		}
	}, []);

	const handleToggleControl = useCallback(async (friendId: string, currentValue: boolean) => {
		setTogglingUserId(friendId);
		try {
			if (currentValue) {
				await musicControlApi.revokeControl(friendId);
				setControlPermissions(prev => {
					const next = new Set(prev);
					next.delete(friendId);
					return next;
				});
			} else {
				await musicControlApi.grantControl(friendId);
				setControlPermissions(prev => new Set(prev).add(friendId));
			}
		} catch (err) {
			console.error('[FriendsScreen] Failed to toggle control:', err);
			showError(apiErrorMessage(err, 'Impossible de modifier les permissions'));
		} finally {
			setTogglingUserId(null);
		}
	}, []);

	// Background refresh on focus - show spinner only on first load
	useFocusEffect(
		useCallback(() => {
			const isFirstMount = !hasMountedRef.current;
			hasMountedRef.current = true;

			// Silent refresh if we already have data, otherwise show spinner
			const silent = friends.length > 0 && !isFirstMount;
			loadFriends(silent);
			loadPermissions();
		}, [loadFriends, loadPermissions, friends.length])
	);

	// `isRefresh`: a failed pull-refresh keeps the shown results, toast only.
	const performSearch = useCallback(
		async (query: string, isRefresh = false) => {
			if (!query.trim() || !accessToken) {
				setSearchResults([]);
				return;
			}

			setIsSearching(true);
			if (!isRefresh) setSearchFailed(false);

			try {
				const results = await profileApi.searchUsers(accessToken, query);
				setSearchResults(results);
			} catch (error) {
				console.error('[FriendsScreen] User search failed:', error);
				showError(apiErrorMessage(error, 'La recherche a échoué'));
				if (!isRefresh) {
					setSearchResults([]);
					setSearchFailed(true);
				}
			} finally {
				setIsSearching(false);
			}
		},
		[accessToken]
	);

	// Pull to refresh, one flag per list: the shown list stays while it reloads.
	const [isRefreshingFriends, setIsRefreshingFriends] = useState(false);
	const [isRefreshingSearch, setIsRefreshingSearch] = useState(false);

	const handleRefreshFriends = useCallback(async () => {
		setIsRefreshingFriends(true);
		try {
			await Promise.all([loadFriends(true), loadPermissions()]);
		} finally {
			setIsRefreshingFriends(false);
		}
	}, [loadFriends, loadPermissions]);

	// Reruns the current query; with no query there is nothing to fetch.
	const handleRefreshSearch = useCallback(async () => {
		if (!searchQuery.trim()) return;
		setIsRefreshingSearch(true);
		try {
			await performSearch(searchQuery, true);
		} finally {
			setIsRefreshingSearch(false);
		}
	}, [performSearch, searchQuery]);

	const debouncedSearch = React.useMemo(
		() => debounce((query: string) => performSearch(query), 500),
		[performSearch]
	);

	useEffect(() => {
		return () => debouncedSearch.cancel();
	}, [debouncedSearch]);

	const handleSearchChange = (text: string) => {
		setSearchQuery(text);
		setSearchFailed(false);
		if (text.trim()) {
			debouncedSearch(text);
		} else {
			debouncedSearch.cancel();
			setSearchResults([]);
		}
	};

	const handleUserPress = (userId: string) => {
		navigation.navigate('UserProfile', { userId });
	};

	const renderFriendItem = ({ item }: { item: FriendProfile }) => {
		const canControl = controlPermissions.has(item.id);
		const isToggling = togglingUserId === item.id;

		return (
			<TouchableOpacity
				style={[styles.userItem, isToggling && styles.userItemProcessing]}
				onPress={() => handleUserPress(item.id)}
				activeOpacity={0.7}
			>
				<Avatar size="md" name={item.displayName || item.username} uri={item.avatarUrl} />
				<View style={styles.userInfo}>
					<Text style={styles.username}>{item.username}</Text>
					{item.displayName && <Text style={styles.displayName}>{item.displayName}</Text>}
					<View style={styles.controlRow}>
						<Ionicons
							name="musical-notes"
							size={12}
							color={canControl ? theme.colors.primary : theme.colors.textSecondary}
							style={styles.controlIcon}
						/>
						<Text style={[styles.controlText, canControl && styles.controlTextActive]}>
							Tous mes appareils
						</Text>
					</View>
				</View>
				<View style={styles.controlToggle}>
					{isToggling ? (
						<View style={styles.switchPlaceholder}>
							<LoadingSpinner size="small" />
						</View>
					) : (
						<ThemedSwitch
							value={canControl}
							onValueChange={() => handleToggleControl(item.id, canControl)}
							disabled={!!togglingUserId}
						/>
					)}
				</View>
				<Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
			</TouchableOpacity>
		);
	};

	const renderSearchResultItem = ({ item }: { item: UserProfile }) => (
		<TouchableOpacity
			style={styles.userItem}
			onPress={() => handleUserPress(item.id)}
			activeOpacity={0.7}
		>
			<Avatar size="md" name={item.displayName || item.username} uri={item.avatarUrl} />
			<View style={styles.userInfo}>
				<Text style={styles.username}>{item.username}</Text>
				{item.displayName && <Text style={styles.displayName}>{item.displayName}</Text>}
			</View>
			<Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
		</TouchableOpacity>
	);

	const hasFriends = friends.length > 0;
	// Without friends the search list stands in for the friends tab, but only once the
	// friends load has finished: before that, the skeleton is the only thing to show.
	const showSearch = activeTab === 'search' || (!hasFriends && !isLoading);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				{/* Tabs - only show if user has friends */}
				{hasFriends && (
					<View style={styles.tabsContainer}>
						<TouchableOpacity
							style={[styles.tab, activeTab === 'friends' && styles.tabActive]}
							onPress={() => setActiveTab('friends')}
						>
							<Text style={[styles.tabText, activeTab === 'friends' && styles.tabTextActive]}>
								Mes amis ({friends.length})
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							style={[styles.tab, activeTab === 'search' && styles.tabActive]}
							onPress={() => setActiveTab('search')}
						>
							<Text style={[styles.tabText, activeTab === 'search' && styles.tabTextActive]}>
								Rechercher
							</Text>
						</TouchableOpacity>
					</View>
				)}

				{showSearch && (
					<SearchBar
						value={searchQuery}
						onChangeText={handleSearchChange}
						placeholder="Rechercher un utilisateur..."
						style={styles.searchBar}
					/>
				)}
			</View>

			{activeTab === 'friends' &&
				(isLoading && friends.length === 0 ? (
					<SkeletonList count={6} row={UserRowSkeleton} />
				) : (
					<FlatList
						data={friends}
						refreshControl={
							<RefreshControl
								refreshing={isRefreshingFriends}
								onRefresh={handleRefreshFriends}
								tintColor={theme.colors.primary}
								colors={[theme.colors.primary]}
							/>
						}
						keyExtractor={item => item.id}
						renderItem={renderFriendItem}
						contentContainerStyle={[
							styles.listContent,
							{ paddingBottom: playerHeight + theme.spacing.xl },
						]}
						ListEmptyComponent={
							<EmptyState
								style={styles.emptyState}
								icon="people-outline"
								message="Aucun ami pour l'instant. Suivez des utilisateurs qui vous suivent en retour pour devenir amis."
								action={{
									label: 'Rechercher des utilisateurs',
									onPress: () => setActiveTab('search'),
								}}
							/>
						}
					/>
				))}

			{showSearch &&
				(isSearching && !isRefreshingSearch && searchResults.length === 0 ? (
					<SkeletonList count={6} row={UserRowSkeleton} />
				) : (
					<FlatList
						data={searchResults}
						refreshControl={
							<RefreshControl
								refreshing={isRefreshingSearch}
								onRefresh={handleRefreshSearch}
								tintColor={theme.colors.primary}
								colors={[theme.colors.primary]}
							/>
						}
						keyExtractor={item => item.id}
						renderItem={renderSearchResultItem}
						contentContainerStyle={[
							styles.listContent,
							{ paddingBottom: playerHeight + theme.spacing.xl },
						]}
						ListEmptyComponent={
							searchFailed && searchQuery.trim() ? (
								<EmptyState
									style={styles.emptyState}
									icon="cloud-offline-outline"
									message="La recherche a échoué"
									action={{ label: 'Réessayer', onPress: () => performSearch(searchQuery) }}
								/>
							) : (
								<EmptyState
									style={styles.emptyState}
									icon="search-outline"
									message={
										searchQuery
											? 'Aucun utilisateur trouvé'
											: 'Commencez à taper pour trouver des utilisateurs'
									}
								/>
							)
						}
					/>
				))}
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		container: {
			flex: 1,
			backgroundColor: theme.colors.background,
		},
		header: {
			paddingHorizontal: theme.spacing.lg,
			paddingTop: theme.spacing.xs,
			paddingBottom: theme.spacing.sm,
		},
		tabsContainer: {
			flexDirection: 'row',
			backgroundColor: theme.colors.surface,
			borderRadius: 12,
			padding: 4,
			marginBottom: theme.spacing.md,
			...theme.shadows.small,
		},
		tab: {
			flex: 1,
			paddingVertical: theme.spacing.sm,
			borderRadius: theme.spacing.xs,
			alignItems: 'center',
		},
		tabActive: {
			backgroundColor: theme.colors.primary,
		},
		tabText: {
			fontSize: theme.typography.sizes.sm,
			fontWeight: theme.typography.weights.medium,
			color: theme.colors.textSecondary,
		},
		tabTextActive: {
			color: theme.colors.surface,
			fontWeight: theme.typography.weights.semibold,
		},
		searchBar: {
			marginBottom: theme.spacing.sm,
		},
		listContent: {
			paddingBottom: theme.spacing.xl,
		},
		userItem: {
			flexDirection: 'row',
			alignItems: 'center',
			paddingVertical: 8,
			paddingHorizontal: theme.spacing.md,
		},
		userItemProcessing: {
			opacity: 0.7,
		},
		userInfo: {
			flex: 1,
			marginLeft: theme.spacing.md,
		},
		username: {
			fontSize: theme.typography.sizes.md,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.text,
		},
		displayName: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: 2,
		},
		controlRow: {
			flexDirection: 'row',
			alignItems: 'center',
			marginTop: 4,
		},
		controlIcon: {
			marginRight: 4,
		},
		controlText: {
			fontSize: theme.typography.sizes.xs,
			color: theme.colors.textSecondary,
		},
		controlTextActive: {
			color: theme.colors.primary,
			fontWeight: theme.typography.weights.medium,
		},
		friendBadge: {
			backgroundColor: theme.colors.success + '20',
			paddingHorizontal: theme.spacing.sm,
			paddingVertical: theme.spacing.xs,
			borderRadius: theme.spacing.xs,
			marginRight: theme.spacing.sm,
		},
		friendBadgeText: {
			fontSize: theme.typography.sizes.xs,
			fontWeight: theme.typography.weights.semibold,
			color: theme.colors.success,
		},
		controlToggle: {
			alignItems: 'center',
			justifyContent: 'center',
			marginRight: theme.spacing.sm,
		},
		switchPlaceholder: {
			width: 51,
			height: 31,
			justifyContent: 'center',
			alignItems: 'center',
		},
		emptyState: {
			paddingTop: theme.spacing.xxl,
		},
	});
