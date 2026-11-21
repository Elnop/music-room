import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { NowPlayingTrack } from '@/features/user/features/friends/features/user-profile/userProfileTypes';
import { NowPlayingArtwork } from '@/features/user/features/friends/features/user-profile/components/presenters/NowPlayingArtwork';
import { NowPlayingPlayButton } from '@/features/user/features/friends/features/user-profile/components/presenters/NowPlayingPlayButton';
import { NowPlayingTrackInfo } from '@/features/user/features/friends/features/user-profile/components/presenters/NowPlayingTrackInfo';

type NowPlayingInlineProps = {
	track: NowPlayingTrack;
	isPlaying: boolean;
	onPlay: () => void;
	onPause: () => void;
	controllable?: boolean;
};

export function NowPlayingInline({
	track,
	isPlaying,
	onPlay,
	onPause,
	controllable = true,
}: NowPlayingInlineProps) {
	const { styles } = useThemedStyles(createStyles);

	return (
		<View style={styles.trackCard}>
			<NowPlayingArtwork artworkUrl={track.artworkUrl} />
			<NowPlayingTrackInfo track={track} isPlaying={isPlaying} />
			{controllable && (
				<NowPlayingPlayButton isPlaying={isPlaying} onPlay={onPlay} onPause={onPause} />
			)}
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		trackCard: {
			flexDirection: 'row',
			alignItems: 'center',
			backgroundColor: theme.colors.surfaceAlt,
			padding: theme.spacing.sm,
			marginTop: theme.spacing.sm,
		},
	});
	return styles;
}
