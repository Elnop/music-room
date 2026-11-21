import React from 'react';
import { View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { createTrackTableColumns } from '@/features/playlists/features/editor/features/detail/lib/createTrackTableColumns';
import { TrackPositionMark } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackPositionMark';
import type { TrackRowState } from '@/features/playlists/features/editor/features/detail/types/trackRowTypes';

type TrackPositionCellProps = {
	position: number;
	state: TrackRowState;
	showPlay: boolean;
};

export function TrackPositionCell({ position, state, showPlay }: TrackPositionCellProps) {
	const columns = useThemedStyles(createTrackTableColumns).styles;

	return (
		<View style={columns.position}>
			<TrackPositionMark position={position} state={state} showPlay={showPlay} />
		</View>
	);
}
