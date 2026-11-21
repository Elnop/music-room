import React from 'react';
import { View } from 'react-native';
import { PlaylistCardSkeleton, SkeletonList } from '@/shared/theme/components/Skeleton';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { useContentColumn } from '@/shared/content-column/useContentColumn';
import { HomeSkeletonHeader } from '@/features/playlists/features/browse/features/home/components/presenters/HomeSkeletonHeader';
import {
	createGridStyles,
	createListStyles,
} from '@/features/playlists/features/browse/shared/playlist-grid/lib/listStyles';

export function HomeSkeleton() {
	const { styles: list } = useThemedStyles(createListStyles);
	const { styles: grid } = useThemedStyles(createGridStyles);
	const column = useContentColumn();

	return (
		<View style={list.container}>
			<SkeletonList
				count={4}
				row={PlaylistCardSkeleton}
				style={[list.list, grid.grid, column]}
				header={<HomeSkeletonHeader />}
			/>
		</View>
	);
}
