import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Artwork } from '@/shared/components/media/Artwork';
import type { Theme } from '@/shared/theme/types';
import { useThemedStyles } from '@/shared/theme/useThemedStyles';
import type { PlaylistWithTracks } from '@/features/playlists/types';

const COVER_SIZE = 200;

/** The cover of a playlist's header, or its first track's artwork. */
export function PlaylistCover({
	playlist,
	style,
}: {
	playlist: PlaylistWithTracks;
	style?: StyleProp<ViewStyle>;
}) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={[styles.cover, style]}>
			<Artwork
				uri={playlist.coverUrl || playlist.tracks[0]?.albumArt}
				size={COVER_SIZE}
				iconSize={64}
				style={styles.artwork}
			/>
		</View>
	);
}

const createStyles = (theme: Theme) =>
	StyleSheet.create({
		cover: {
			borderRadius: 8,
			backgroundColor: theme.colors.surfaceAlt,
			shadowColor: theme.colors.shadow,
			shadowOffset: { width: 0, height: 8 },
			shadowOpacity: 0.3,
			shadowRadius: 12,
			elevation: 8,
		},
		artwork: { borderRadius: 8 },
	});
