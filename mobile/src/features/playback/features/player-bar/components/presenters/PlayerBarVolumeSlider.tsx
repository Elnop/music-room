import React from 'react';
import { StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useThemedStyles } from '@/shared/theme/hooks/useThemedStyles';
import type { Theme } from '@/shared/theme/types/themeTypes';
import type { PlayerBarVolume } from '@/features/playback/features/player-bar/playerBarTypes';

const VOLUME_SLIDER_WIDTH = 96;

type PlayerBarVolumeSliderProps = {
	volume: PlayerBarVolume;
};

export function PlayerBarVolumeSlider({ volume }: PlayerBarVolumeSliderProps) {
	const { styles, theme } = useThemedStyles(createStyles);

	return (
		<Slider
			style={styles.volumeSlider}
			minimumValue={0}
			maximumValue={1}
			value={volume.value}
			onValueChange={volume.onChange}
			disabled={volume.disabled}
			minimumTrackTintColor={theme.colors.text}
			maximumTrackTintColor={theme.colors.borderLight}
			thumbTintColor={theme.colors.text}
			accessibilityLabel="Volume"
		/>
	);
}

function createStyles(theme: Theme) {
	const styles = StyleSheet.create({
		volumeSlider: { width: VOLUME_SLIDER_WIDTH, height: theme.controls.slider },
	});
	return styles;
}
