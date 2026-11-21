import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Artwork } from '@/shared/theme/components/Artwork';
import { Text } from '@/shared/theme/components/Text';
import { pixelFrame } from '@/shared/theme/lib/pixelFrame';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Playlist, UserSummary } from '@/features/playlists/shared/playlist/playlistTypes';
import { widthStyle } from '@/features/playlists/features/browse/shared/playlist-grid/lib/sizedStyles';
import { PlaylistCassetteMeta } from '@/features/playlists/features/browse/shared/playlist-grid/components/PlaylistCassetteMeta';

type PlaylistCassetteProps = {
	playlist: Playlist;
	owner?: UserSummary;
	width: number;
};

export function PlaylistCassette({ playlist, owner, width }: PlaylistCassetteProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={widthStyle(width)}>
			<View style={styles.cover}>
				<Artwork
					uri={playlist.coverUrl || playlist.firstTrackCover}
					size={width - 6}
					iconSize={32}
				/>
			</View>
			<Text style={styles.name} numberOfLines={2}>
				{playlist.name}
			</Text>
			<PlaylistCassetteMeta playlist={playlist} owner={owner} />
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		cover: { ...pixelFrame(theme), backgroundColor: theme.colors.surfaceAlt },
		name: {
			fontSize: theme.typography.sizes.md,
			fontFamily: theme.typography.families.medium,
			color: theme.colors.text,
			lineHeight: theme.typography.lineHeights.xs,
			height: theme.typography.lineHeights.xs * 2,
			marginTop: theme.spacing.sm,
		},
	});
	return styles;
}
