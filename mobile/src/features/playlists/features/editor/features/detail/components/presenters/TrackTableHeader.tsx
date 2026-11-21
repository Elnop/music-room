import React from 'react';
import { StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { useSeparatorColor } from '@/shared/theme/hooks/useSeparatorColor';
import { useTheme } from '@/shared/theme/hooks/useTheme';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { tableRowFrame } from '@/features/playlists/features/editor/features/detail/lib/tableRowFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { createTrackTableColumns } from '@/features/playlists/features/editor/features/detail/lib/createTrackTableColumns';
import { TrackTableHeaderLabel } from '@/features/playlists/features/editor/features/detail/components/presenters/TrackTableHeaderLabel';
import ClockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/clock-solid.svg';

export function TrackTableHeader() {
	const { theme } = useTheme();
	const separator = useSeparatorColor();
	const styles = React.useMemo(() => createStyles(theme, separator), [theme, separator]);
	const columns = useThemedStyles(createTrackTableColumns).styles;

	return (
		<View style={styles.row}>
			<TrackTableHeaderLabel style={columns.position} label="#" />
			<TrackTableHeaderLabel style={columns.title} label="Titre" />
			<TrackTableHeaderLabel style={columns.artist} label="Artiste" />
			<View style={columns.duration}>
				<PixelIcon
					icon={ClockSolid}
					size={16}
					color={theme.colors.textSecondary}
					accessibilityLabel="Durée"
				/>
			</View>
			<View style={columns.trailing} />
		</View>
	);
}

function createStyles(theme: Theme, separator: string) {
	const styles = StyleSheet.create({
		row: {
			...tableRowFrame(theme, separator),
			paddingVertical: theme.spacing.sm,
		},
	});
	return styles;
}
