import React from 'react';
import { StyleSheet } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { NowPlaying } from '@/features/playback/shared/player/types/playerTypes';
import { PlayerBarButton } from '@/features/playback/features/player-bar/components/presenters/PlayerBarButton';
import type { PlayerBarTransport } from '@/features/playback/features/player-bar/playerBarTypes';
import PauseSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/pause-solid.svg';
import PlaySolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/play-solid.svg';

type PlayerBarPlayButtonProps = {
	nowPlaying: NowPlaying;
	transport: PlayerBarTransport;
};

export function PlayerBarPlayButton({ nowPlaying, transport }: PlayerBarPlayButtonProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const { track, isPlaying } = nowPlaying;

	return (
		<PlayerBarButton
			icon={isPlaying ? PauseSolid : PlaySolid}
			label={isPlaying ? 'Pause' : 'Lecture'}
			onPress={transport.handlePlayPause}
			state={{ disabled: transport.playDisabled, busy: nowPlaying.isLoading }}
			appearance={{
				color: track ? theme.colors.onColor : theme.colors.textSecondary,
				style: [styles.playButton, !track && styles.playButtonEmpty],
			}}
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		playButton: {
			width: theme.controls.iconButtonXl,
			height: theme.controls.iconButtonXl,
			backgroundColor: theme.colors.primary,
		},
		playButtonEmpty: { backgroundColor: theme.colors.surfaceAlt },
	});
	return styles;
}
