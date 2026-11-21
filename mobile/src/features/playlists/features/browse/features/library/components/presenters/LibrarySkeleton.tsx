import React from 'react';
import { View } from 'react-native';
import { PlaylistCardSkeleton, SkeletonList } from '@/shared/theme/components/Skeleton';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import {
	createGridStyles,
	createListStyles,
} from '@/features/playlists/features/browse/shared/playlist-grid/lib/listStyles';

export function LibrarySkeleton() {
	const { styles } = useThemedStyles(createListStyles);
	const { styles: grid } = useThemedStyles(createGridStyles);
	const column = useContentColumn();

	return (
		<View style={styles.container}>
			<SkeletonList count={4} row={PlaylistCardSkeleton} style={[styles.list, grid.grid, column]} />
		</View>
	);
}
