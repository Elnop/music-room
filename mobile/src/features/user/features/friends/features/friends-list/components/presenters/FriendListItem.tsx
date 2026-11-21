import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { ViewStyle } from 'react-native';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { FriendProfile } from '@/features/user/features/friends/friendsTypes';
import type { FriendCell } from '@/features/user/features/friends/features/friends-list/friendsListTypes';
import { FriendCard } from '@/features/user/features/friends/features/friends-list/components/presenters/FriendCard';
import { FriendItemRow } from '@/features/user/features/friends/features/friends-list/components/presenters/FriendItemRow';

type FriendListItemProps = {
	friend: FriendProfile;
	cell: FriendCell;
};

export function FriendListItem({ friend, cell }: FriendListItemProps) {
	const { styles } = useThemedStyles(createStyles);

	if (cell.columns === 1) {
		return <FriendItemRow friend={friend} control={cell.control} onPress={cell.onSelectUser} />;
	}
	return (
		<View style={[styles.gridCell, cellFlexStyle(cell.columns)]}>
			<FriendCard friend={friend} control={cell.control} onPress={cell.onSelectUser} />
		</View>
	);
}

function cellFlexStyle(columns: number): ViewStyle {
	return { flex: 1 / columns };
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		gridCell: {
			...pixelFrame(theme),
			backgroundColor: theme.colors.surface,
			marginBottom: theme.spacing.sm,
		},
	});
	return styles;
}
