import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

export type SeekPosition = {
	position: number;
	onSlidingStart: (value: number) => void;
	onValueChange: (value: number) => void;
	onSlidingComplete: (value: number) => void;
};

export type ProgressSliderStyles = {
	progressContainer: StyleProp<ViewStyle>;
	slider: StyleProp<ViewStyle>;
	timeContainer: StyleProp<ViewStyle>;
	timeText: StyleProp<TextStyle>;
};

export type ProgressSliderColors = {
	slider: string;
	sliderBg: string;
	textSecondary: string;
};

export type ProgressSliderAppearance = {
	styles: ProgressSliderStyles;
	colors: ProgressSliderColors;
};
