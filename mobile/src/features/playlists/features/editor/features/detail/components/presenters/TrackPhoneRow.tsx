import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TrackActionsButton } from '@/shared/theme/components/TrackActionsButton';
import { useContextMenu } from '@/shared/theme/hooks/useContextMenu';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { pixelRow } from '@/shared/theme/lib/pixelFrame';
import { TrackPhoneDragHandle } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackPhoneDragHandle';
import { TrackPhoneButton } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackPhoneButton';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { Track } from '@/shared/tracks/types/trackTypes';
import type {
	TrackRowActions,
	TrackRowState,
} from '@/features/playlists/features/editor/features/detail/types/trackRowTypes';

type TrackPhoneRowProps = {
	track: Track;
	state: TrackRowState;
	actions: TrackRowActions;
};

export function TrackPhoneRow({ track, state, actions }: TrackPhoneRowProps) {
	const { styles } = useThemedStyles(createStyles);
	const contextMenu = useContextMenu(actions.onShowActions);

	return (
		<View
			{...contextMenu}
			style={[
				styles.trackContainer,
				state.isCurrent && styles.trackContainerCurrent,
				state.isDragActive && styles.trackContainerActive,
			]}
		>
			<TrackPhoneButton track={track} state={state} actions={actions} />
			{actions.onShowActions && <TrackActionsButton onPress={actions.onShowActions} />}
			{actions.onDragStart && <TrackPhoneDragHandle onDragStart={actions.onDragStart} />}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		trackContainer: pixelRow(theme),
		trackContainerCurrent: {
			backgroundColor: theme.colors.surfaceAlt,
		},
		trackContainerActive: {
			...theme.shadows.large,
		},
	});
	return styles;
}
