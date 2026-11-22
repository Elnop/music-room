import React from 'react';
import { SwipeableTrackItem } from '@/features/playlists/features/editor/features/detail/components/presenters/SwipeableTrackItem';
import type { ReorderableRenderItemInfo } from '@/shared/theme/types/reorderableTypes';
import type { TrackInPlaylist } from '@/shared/tracks/types/trackTypes';
import type { DetailPage } from '@/features/playlists/features/editor/features/detail/types/detailPageTypes';

type DetailTrackItemProps = {
	page: Pick<DetailPage, 'tracks' | 'play'>;
	info: ReorderableRenderItemInfo<TrackInPlaylist>;
};

export function DetailTrackItem({ page, info }: DetailTrackItemProps) {
	const { tracks, play } = page;
	const { item } = info;
	const { canEdit } = tracks;

	return (
		<SwipeableTrackItem
			track={item}
			position={info.index + 1}
			state={{
				disabled: !canEdit,
				isDragActive: info.isActive,
				isCurrent: tracks.currentUri !== null && item.trackUri === tracks.currentUri,
				isPending: play.pendingTrackId === item.id,
				unavailable: item.unavailable,
			}}
			handlers={{
				onDelete: () => tracks.deleteTrack(item.id),
				onAddToQueue: () => tracks.addToQueue(item),
				onShowActions: (anchor) => tracks.showActions(item, anchor),
				onDragStart: canEdit ? info.drag : undefined,
				onPress: item.unavailable ? tracks.explainUnavailable : () => play.playFrom(item),
			}}
		/>
	);
}
