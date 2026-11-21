import React from 'react';
import { QueueSwipe } from '@/shared/theme/components/QueueSwipe';
import { useBreakpoint } from '@/shared/theme/hooks/useBreakpoint';
import { TrackDeleteAction } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackDeleteAction';
import { TrackPhoneRow } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackPhoneRow';
import { TrackTableRow } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackTableRow';
import {
	rowActions,
	rowState,
} from '@/features/playlists/features/editor/features/detail/lib/trackItemRow';
import type { Track } from '@/shared/tracks/types/trackTypes';
import type {
	TrackItemHandlers,
	TrackItemState,
} from '@/features/playlists/features/editor/features/detail/types/trackRowTypes';

type SwipeableTrackItemProps = {
	track: Track;
	handlers: TrackItemHandlers;
	state?: TrackItemState;
	position?: number;
};

export function SwipeableTrackItem({
	track,
	handlers,
	state = {},
	position,
}: SwipeableTrackItemProps) {
	const { isWide } = useBreakpoint();
	const row = { state: rowState(state), actions: rowActions(state, handlers) };

	return (
		<QueueSwipe
			onAddToQueue={state.unavailable ? undefined : handlers.onAddToQueue}
			rightActions={
				state.disabled ? undefined : (
					<TrackDeleteAction track={track} onDelete={handlers.onDelete} />
				)
			}
		>
			{isWide && position !== undefined ? (
				<TrackTableRow track={track} position={position} {...row} />
			) : (
				<TrackPhoneRow track={track} {...row} />
			)}
		</QueueSwipe>
	);
}
