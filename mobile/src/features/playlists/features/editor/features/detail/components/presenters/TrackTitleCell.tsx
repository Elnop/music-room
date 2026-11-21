import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { PixelIcon } from '@/shared/theme/components/PixelIcon';
import { Text } from '@/shared/theme/components/Text';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import { createTrackTableColumns } from '@/features/playlists/features/editor/features/detail/lib/createTrackTableColumns';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { Track } from '@/shared/tracks/types/trackTypes';
import type { TrackRowState } from '@/features/playlists/features/editor/features/detail/types/trackRowTypes';
import MusicSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/music-solid.svg';

type TrackTitleCellProps = {
	track: Track;
	state: TrackRowState;
};

export function TrackTitleCell({ track, state }: TrackTitleCellProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const columns = useThemedStyles(createTrackTableColumns).styles;

	return (
		<View style={[columns.title, state.unavailable && styles.unavailable]}>
			{track.albumArt ? (
				<Image source={{ uri: track.albumArt }} style={styles.albumArt} />
			) : (
				<View style={[styles.albumArt, styles.albumArtPlaceholder]}>
					<PixelIcon icon={MusicSolid} size={18} color={theme.colors.textSecondary} />
				</View>
			)}
			<Text style={[styles.title, state.isCurrent && styles.titleCurrent]} numberOfLines={1}>
				{track.title}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		albumArt: {
			width: theme.controls.tableArtwork,
			height: theme.controls.tableArtwork,
			marginRight: theme.spacing.smd,
		},
		albumArtPlaceholder: {
			backgroundColor: theme.colors.surfaceAlt,
			justifyContent: 'center',
			alignItems: 'center',
		},
		title: {
			flex: 1,
			fontSize: theme.typography.sizes.mlg,
			fontFamily: theme.typography.families.semibold,
			color: theme.colors.text,
		},
		titleCurrent: { color: theme.colors.primary },
		unavailable: { opacity: 0.4 },
	});
	return styles;
}
