import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { Text } from '@/shared/theme/components/Text';
import type { NowPlayingTrack } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { NowPlayingTitle } from '@/features/user/features/friends/features/user-profile/components/presenters/NowPlayingTitle';

type NowPlayingTrackInfoProps = {
	track: NowPlayingTrack;
	isPlaying: boolean;
};

export function NowPlayingTrackInfo({ track, isPlaying }: NowPlayingTrackInfoProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.trackInfo}>
			<NowPlayingTitle title={track.title} isPlaying={isPlaying} />
			<Text style={styles.artist} numberOfLines={1}>
				{track.artist}
			</Text>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		trackInfo: {
			flex: 1,
			marginLeft: theme.spacing.sm,
			marginRight: theme.spacing.sm,
		},
		artist: {
			fontSize: theme.typography.sizes.sm,
			color: theme.colors.textSecondary,
			marginTop: theme.spacing.hairline,
		},
	});
	return styles;
}
