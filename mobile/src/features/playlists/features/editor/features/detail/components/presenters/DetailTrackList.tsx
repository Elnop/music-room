import React from 'react';
import { RefreshControl } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { EmptyState } from '@/shared/theme/components/EmptyState';
import { ReorderableList } from '@/shared/theme/components/ReorderableList';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { DetailTrackItem } from '@/features/playlists/features/editor/features/detail/components/presenters/DetailTrackItem';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/playlistTypes';
import type { DetailPage } from '@/features/playlists/features/editor/features/detail/types/detailPageTypes';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type DetailTrackListProps = {
	page: DetailPage;
	playlist: PlaylistWithTracks;
	frame: { header: React.ReactElement; contentStyle: StyleProp<ViewStyle> };
};

const EMPTY = (
	<EmptyState icon={MusicSolid} message="Aucun titre dans cette playlist pour l'instant" />
);

export function DetailTrackList({ page, playlist, frame }: DetailTrackListProps) {
	const { theme } = useTheme();

	return (
		<ReorderableList
			data={playlist.tracks}
			keyExtractor={(item) => item.id}
			onReorder={page.tracks.reorder}
			dragEnabled={page.tracks.canEdit && !page.tracks.isMoving}
			extraData={page.tracks.currentUri}
			renderItem={(info) => <DetailTrackItem page={page} info={info} />}
			ListHeaderComponent={frame.header}
			contentContainerStyle={frame.contentStyle}
			ListEmptyComponent={EMPTY}
			refreshControl={
				<RefreshControl
					refreshing={page.screen.isRefreshing}
					onRefresh={page.screen.refresh}
					tintColor={theme.colors.primary}
					colors={[theme.colors.primary]}
				/>
			}
			showsVerticalScrollIndicator={false}
		/>
	);
}
