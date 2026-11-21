import React from 'react';
import { StyleSheet, View } from 'react-native';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { FriendsTabs } from '@/features/user/features/friends/features/friends-list/friendsListTypes';
import { FriendsTabButton } from '@/features/user/features/friends/features/friends-list/components/presenters/FriendsTabButton';

type FriendsTabsBarProps = {
	tabs: FriendsTabs;
	friendsCount: number;
};

export function FriendsTabsBar({ tabs, friendsCount }: FriendsTabsBarProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.tabsContainer}>
			<FriendsTabButton
				label={`Mes amis (${friendsCount})`}
				active={tabs.activeTab === 'friends'}
				onPress={() => tabs.onTabChange('friends')}
			/>
			<FriendsTabButton
				label="Rechercher"
				active={tabs.activeTab === 'search'}
				onPress={() => tabs.onTabChange('search')}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		tabsContainer: {
			...pixelFrame(theme),
			flexDirection: 'row',
			backgroundColor: theme.colors.surface,
			padding: theme.borders.thick,
			marginBottom: theme.spacing.md,
		},
	});
	return styles;
}
