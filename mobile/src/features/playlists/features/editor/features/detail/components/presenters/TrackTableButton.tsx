import React from 'react';
import { StyleSheet } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { TrackPositionCell } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackPositionCell';
import { TrackTitleCell } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackTitleCell';
import { TrackTableDetails } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackTableDetails';
import {
	rowAccessibility,
	rowLabel,
} from '@/features/playlists/features/editor/features/detail/lib/trackItemRow';
import type { Track } from '@/shared/tracks/types/trackTypes';
import type {
	TrackRowActions,
	TrackRowState,
} from '@/features/playlists/features/editor/features/detail/types/trackRowTypes';

type TrackTableButtonProps = {
	track: Track;
	position: number;
	state: TrackRowState;
	actions: TrackRowActions;
	hovered: boolean;
};

const styles = StyleSheet.create({
	pressable: { flex: 1, flexDirection: 'row', alignItems: 'center' },
});

export function TrackTableButton({
	track,
	position,
	state,
	actions,
	hovered,
}: TrackTableButtonProps) {
	const showActions = actions.onShowActions;
	const showPlay = hovered && !state.unavailable && !state.isPending && Boolean(actions.onPress);

	return (
		<Pressable
			onPress={actions.onPress}
			onLongPress={showActions ? () => showActions() : undefined}
			accessibilityLabel={`${position}. ${rowLabel(track, state.unavailable)}`}
			accessibilityState={rowAccessibility(state)}
			style={styles.pressable}
		>
			<TrackPositionCell position={position} state={state} showPlay={showPlay} />
			<TrackTitleCell track={track} state={state} />
			<TrackTableDetails track={track} unavailable={state.unavailable} />
		</Pressable>
	);
}
