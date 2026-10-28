import React from 'react';
import { FlatList, View } from 'react-native';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { SkeletonList, UserRowSkeleton } from '@/shared/components/ui/Skeleton';
import { useTheme } from '@/shared/theme/ThemeContext';
import { useBreakpoint } from '@/shared/hooks/useBreakpoint';
import { rowColumns } from '@/shared/utils/gridLayout';
import type { FriendProfile } from '@/features/friends/types';
import { FriendCard } from './FriendCard';
import { FriendItemRow } from './FriendItemRow';
import { ThemedRefreshControl } from '@/shared/components/lists/ThemedRefreshControl';
import { createFriendsListStyles } from './friendsListStyles';
import { useContentColumn } from '@/shared/hooks/useContentColumn';

interface FriendsListTabProps {
	friends: FriendProfile[];
	isLoading: boolean;
	loadFailed: boolean;
	onRetry: () => void;
	isRefreshing: boolean;
	onRefresh: () => void;
	canControl: (friendId: string) => boolean;
	togglingUserId: string | null;
	onToggleControl: (friendId: string, current: boolean) => void;
	onSelectUser: (userId: string) => void;
	onGoToSearch: () => void;
	bottomPadding: number;
}

export function FriendsListTab({
	friends,
	isLoading,
	loadFailed,
	onRetry,
	isRefreshing,
	onRefresh,
	canControl,
	togglingUserId,
	onToggleControl,
	onSelectUser,
	onGoToSearch,
	bottomPadding,
}: FriendsListTabProps) {
	const { theme } = useTheme();
	const styles = React.useMemo(() => createFriendsListStyles(theme), [theme]);
	const column = useContentColumn();
	// A short list spreads over the width instead of leaving empty columns.
	const columns = Math.min(rowColumns(useBreakpoint().breakpoint), Math.max(2, friends.length));

	if (isLoading && friends.length === 0) {
		return <SkeletonList count={6} row={UserRowSkeleton} style={column} />;
	}

	return (
		<FlatList
			key={columns}
			numColumns={columns}
			columnWrapperStyle={columns > 1 ? styles.gridRow : undefined}
			data={friends}
			refreshControl={
				<ThemedRefreshControl
					refreshing={isRefreshing}
					onRefresh={onRefresh}
					color={theme.colors.primary}
				/>
			}
			keyExtractor={item => item.id}
			renderItem={({ item }) => {
				const Row = columns > 1 ? FriendCard : FriendItemRow;
				const row = (
					<Row
						friend={item}
						canControl={canControl(item.id)}
						isToggling={togglingUserId === item.id}
						disabled={!!togglingUserId}
						onPress={onSelectUser}
						onToggleControl={onToggleControl}
					/>
				);
				return columns > 1 ? (
					<View style={[styles.gridCell, { flex: 1 / columns }]}>{row}</View>
				) : (
					row
				);
			}}
			contentContainerStyle={[styles.listContent, { paddingBottom: bottomPadding }, column]}
			ListEmptyComponent={
				loadFailed ? (
					<EmptyState
						style={styles.emptyState}
						icon="alert"
						message="Impossible de charger vos amis"
						action={{ label: 'Réessayer', onPress: onRetry }}
					/>
				) : (
					<EmptyState
						style={styles.emptyState}
						icon="crew"
						message="Aucun ami pour l'instant. Suivez des utilisateurs qui vous suivent en retour pour devenir amis."
						action={{
							label: 'Rechercher des utilisateurs',
							onPress: onGoToSearch,
						}}
					/>
				)
			}
		/>
	);
}
