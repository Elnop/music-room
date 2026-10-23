import React from 'react';
import { FlatList } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SkeletonList, UserRowSkeleton } from '@/shared/components/ui/Skeleton';
import { useTheme } from '@/shared/theme/ThemeContext';
import type { FriendProfile } from '@/features/friends/types';
import { FriendItemRow } from './FriendItemRow';
import { ThemedRefreshControl } from './ThemedRefreshControl';
import { createFriendsListStyles } from './friendsListStyles';

interface FriendsListTabProps {
	friends: FriendProfile[];
	isLoading: boolean;
	isRefreshing: boolean;
	onRefresh: () => void;
	canControl: (friendId: string) => boolean;
	togglingUserId: string | null;
	onToggleControl: (friendId: string, current: boolean) => void;
	onSelectUser: (userId: string) => void;
	onGoToSearch: () => void;
	playerHeight: number;
}

export function FriendsListTab({
	friends,
	isLoading,
	isRefreshing,
	onRefresh,
	canControl,
	togglingUserId,
	onToggleControl,
	onSelectUser,
	onGoToSearch,
	playerHeight,
}: FriendsListTabProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createFriendsListStyles(theme), [theme]);

	if (isLoading && friends.length === 0) {
		return <SkeletonList count={6} row={UserRowSkeleton} />;
	}

	return (
		<FlatList
			data={friends}
			refreshControl={
				<ThemedRefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					color={theme.colors.primary}
				/>
			}
			keyExtractor={item => item.id}
			renderItem={({ item }) => (
				<FriendItemRow
					friend={item}
					canControl={canControl(item.id)}
					isToggling={togglingUserId === item.id}
					disabled={!!togglingUserId}
					onPress={onSelectUser}
					onToggleControl={onToggleControl}
				/>
			)}
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
						onPress: onGoToSearch,
					}}
				/>
			}
		/>
	);
}
