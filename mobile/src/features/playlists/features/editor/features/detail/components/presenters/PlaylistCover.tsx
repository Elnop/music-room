import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Artwork } from '@/shared/theme/components/Artwork';
import type { Theme } from '@/shared/theme/lib/types';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { PlaylistWithTracks } from '@/features/playlists/shared/playlist/lib/types';

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
			<Artwork uri={playlist.coverUrl || playlist.tracks[0]?.albumArt} size={size} iconSize={64} />
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
