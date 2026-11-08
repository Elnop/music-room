import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Artwork } from '@/shared/components/media/Artwork';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { PlaylistWithTracks } from '@/features/playlists/types';

/** The cover of a playlist's header, or its first track's artwork. */
export function PlaylistCover({
	playlist,
	size = 200,
	style,
}: {
	playlist: PlaylistWithTracks;
	size?: number;
	style?: StyleProp<ViewStyle>;
}) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={[styles.cover, style]}>
			<Artwork
				uri={playlist.coverUrl || playlist.tracks[0]?.albumArt}
				size={size}
				iconSize={64}
			/>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		cover: {
			backgroundColor: theme.colors.surfaceAlt,
			borderWidth: theme.borders.thick,
			borderColor: theme.colors.border,
			...theme.shadows.large,
		},
	});
