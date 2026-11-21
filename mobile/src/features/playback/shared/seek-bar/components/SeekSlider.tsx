import React from 'react';
import Slider from '@react-native-community/slider';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SeekPosition } from '@/features/playback/shared/seek-bar/seekBarTypes';

type SeekSliderProps = {
	style: StyleProp<ViewStyle>;
	seek: SeekPosition;
	range: { value: number; maximum: number };
	disabled: boolean;
};

export function SeekSlider({ style, seek, range, disabled }: SeekSliderProps) {
	return (
		<Slider
			style={style}
			minimumValue={0}
			maximumValue={range.maximum}
			value={range.value}
			onSlidingStart={seek.onSlidingStart}
			onValueChange={seek.onValueChange}
			onSlidingComplete={seek.onSlidingComplete}
			minimumTrackTintColor="transparent"
			maximumTrackTintColor="transparent"
			thumbTintColor="transparent"
			disabled={disabled}
			importantForAccessibility="no-hide-descendants"
		/>
	);
}
