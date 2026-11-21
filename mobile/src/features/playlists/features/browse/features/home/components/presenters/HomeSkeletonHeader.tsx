import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SkeletonBlock } from '@/shared/theme/components/Skeleton';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { FriendCardSkeleton } from '@/features/playlists/features/browse/features/home/components/presenters/FriendCardSkeleton';
import { createGridStyles } from '@/features/playlists/features/browse/shared/playlist-grid/lib/listStyles';

export function HomeSkeletonHeader() {
	const { styles: grid } = useThemedStyles(createGridStyles);
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.header}>
			<SkeletonBlock width={180} height={18} style={styles.title} />
			<View style={[grid.friendsSkeleton, styles.carousel]}>
				<FriendCardSkeleton />
				<FriendCardSkeleton />
				<FriendCardSkeleton />
			</View>
			<SkeletonBlock width={140} height={18} style={styles.title} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		header: {
			width: '100%',
		},
		title: {
			marginBottom: theme.spacing.md,
		},
		carousel: {
			paddingHorizontal: 0,
			marginBottom: theme.spacing.md * 2 + theme.spacing.sm,
		},
	});
	return styles;
}
