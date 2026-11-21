import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Pressable } from '@/shared/theme/components/Pressable';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { TrackActionsButton } from '@/shared/theme/components/TrackActionsButton';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { createTrackTableColumns } from '@/features/playlists/features/editor/features/detail/lib/createTrackTableColumns';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { TrackRowActions } from '@/features/playlists/features/editor/features/detail/types/trackRowTypes';
import BarsSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/bars-solid.svg';

type TrackTableTrailingProps = {
	actions: TrackRowActions;
	faded: boolean;
};

export function TrackTableTrailing({ actions, faded }: TrackTableTrailingProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const columns = useThemedStyles(createTrackTableColumns).styles;

	return (
		<View style={[columns.trailing, styles.trailing]}>
			{actions.onShowActions && <TrackActionsButton onPress={actions.onShowActions} />}
			{actions.onDragStart && (
				<Pressable
					onPressIn={actions.onDragStart}
					hitSlop={10}
					style={[styles.dragHandle, faded && styles.dragHandleIdle]}
					accessibilityLabel="Réordonner"
				>
					<PixelIcon icon={BarsSolid} size={22} color={theme.colors.textSecondary} />
				</Pressable>
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		trailing: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
		dragHandle: { marginLeft: theme.spacing.xs, padding: theme.spacing.xs },
		dragHandleIdle: { opacity: 0.3 },
	});
	return styles;
}
