import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import { PlayerProgressSlider } from '@/features/playback/shared/seek-bar/components/PlayerProgressSlider';
import { playerBarSliderStyles } from '@/features/playback/features/player-bar/components/presenters/playerBarSliderStyles';
import type { PlayerBarPlayback } from '@/features/playback/features/player-bar/playerBarTypes';

type PlayerBarProgressProps = {
	playback: PlayerBarPlayback;
};

export function PlayerBarProgress({ playback }: PlayerBarProgressProps) {
	const { styles, theme } = useThemedStyles(createStyles);
	const sliderStyles = useThemedStyles(playerBarSliderStyles).styles;
	const { transport } = playback;
	const appearance = {
		styles: sliderStyles,
		colors: {
			slider: theme.colors.primary,
			sliderBg: theme.colors.borderLight,
			textSecondary: theme.colors.textSecondary,
		},
	};

	return (
		<View style={styles.progressSlot}>
			<PlayerProgressSlider
				appearance={appearance}
				seek={playback.seek}
				duration={transport.duration}
				hasTrack={playback.nowPlaying.track !== null}
				disabled={transport.sliderDisabled}
				onSliderAction={transport.handleSliderAction}
			/>
		</View>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		progressSlot: { height: theme.controls.slider, justifyContent: 'center' },
	});
	return styles;
}
