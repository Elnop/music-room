import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PlaylistCardSkeleton, SkeletonBlock, SkeletonList } from '@/shared/components/ui/Skeleton';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import { FriendCardSkeleton } from './FriendCardSkeleton';
import { createListStyles } from './listStyles';

/** The playlists screen before its first answer: friends' carousel, then the grid. */
export function PlaylistsSkeleton() {
	const { styles: list } = useThemedStyles(createListStyles);
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={list.container}>
			<SkeletonList
				count={4}
				row={PlaylistCardSkeleton}
				style={[list.list, list.grid]}
				header={
					<View style={styles.header}>
						<SkeletonBlock width={180} height={18} style={styles.title} />
						<View style={[list.friendsSkeleton, styles.carousel]}>
							<FriendCardSkeleton />
							<FriendCardSkeleton />
							<FriendCardSkeleton />
						</View>
						<SkeletonBlock width={140} height={18} style={styles.title} />
					</View>
				}
			/>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
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
