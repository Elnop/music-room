import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTableRowPointer } from '@/features/playlists/features/editor/features/detail/hooks/useTableRowPointer';
import { useSeparatorColor } from '@/shared/theme/hooks/useSeparatorColor';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { TrackTableButton } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackTableButton';
import { TrackTableTrailing } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackTableTrailing';
import { tableRowFrame } from '@/features/playlists/features/editor/features/detail/lib/tableRowFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { Track } from '@/shared/tracks/types/trackTypes';
import type {
	TrackRowActions,
	TrackRowState,
} from '@/features/playlists/features/editor/features/detail/types/trackRowTypes';

type TrackTableRowProps = {
	track: Track;
	position: number;
	state: TrackRowState;
	actions: TrackRowActions;
};

export function TrackTableRow({ track, position, state, actions }: TrackTableRowProps) {
	const { theme } = useTheme();
	const separator = useSeparatorColor();
	const styles = React.useMemo(() => createStyles(theme, separator), [theme, separator]);
	const hover = useTableRowPointer(actions.onShowActions);

	return (
		<View
			{...hover.pointerProps}
			style={[
				styles.row,
				(hover.hovered || state.isCurrent) && styles.rowHighlighted,
				state.isDragActive && styles.rowActive,
			]}
		>
			<TrackTableButton
				track={track}
				position={position}
				state={state}
				actions={actions}
				hovered={hover.hovered}
			/>
			<TrackTableTrailing actions={actions} faded={!hover.hovered && !state.isDragActive} />
		</View>
	);
}

function createStyles(theme: Theme, separator: string) {
	const styles = StyleSheet.create({
		row: {
			...tableRowFrame(theme, separator),
			paddingVertical: theme.spacing.xsm,
			backgroundColor: theme.colors.background,
		},
		rowHighlighted: { backgroundColor: theme.colors.surface },
		rowActive: {
			backgroundColor: theme.colors.surfaceAlt,
			...theme.shadows.large,
		},
	});
	return styles;
}
